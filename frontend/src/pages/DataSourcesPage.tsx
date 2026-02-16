import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Database,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { dataApi } from "@/lib/api";
import type { UploadResponse } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export const DataSourcesPage = () => {
  const { datasets, addDataset, setActiveDataset, removeDataset } =
    useAppStore();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [preview, setPreview] = useState<UploadResponse | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        alert("Only CSV files are supported");
        return;
      }
      setIsUploading(true);
      try {
        const result = await dataApi.upload(file);
        setPreview(result);
        addDataset(result.dataset);
        setActiveDataset(result.dataset);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [addDataset, setActiveDataset]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleLoadDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    try {
      const result = await dataApi.loadDemo();
      setPreview(result);
      addDataset(result.dataset);
      setActiveDataset(result.dataset);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setIsLoadingDemo(false);
    }
  }, [addDataset, setActiveDataset]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await dataApi.delete(id);
        removeDataset(id);
        if (preview?.dataset.id === id) setPreview(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [removeDataset, preview]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Data Sources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload CSV data or try with our built-in sample dataset
        </p>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className={`lg:col-span-2 border-dashed border-2 transition-colors cursor-pointer ${isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isUploading ? "Uploading..." : "Drag & drop your CSV file here"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="file-upload"
              onChange={handleFileInput}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isUploading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Select CSV File
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Try Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Load our demo dataset: a developer tools SaaS platform with 200
              accounts and Q1 2026 product data — usage metrics, churn signals,
              and feature requests.
            </p>
            <Button
              className="w-full"
              onClick={handleLoadDemo}
              disabled={isLoadingDemo}
            >
              <Database className="h-4 w-4 mr-2" />
              {isLoadingDemo ? "Loading..." : "Load Demo Dataset"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Datasets List */}
      {datasets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Columns</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((ds) => (
                  <TableRow
                    key={ds.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setActiveDataset(ds);
                      navigate("/");
                    }}
                  >
                    <TableCell className="font-medium text-sm">
                      {ds.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ds.row_count?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ds.columns?.length}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="gap-1 text-emerald-500"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Ready
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ds.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Preview: {preview.dataset.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {preview.row_count.toLocaleString()} rows ×{" "}
                {preview.columns.length} columns
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-96 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview.columns.map((col) => (
                      <TableHead key={col} className="text-xs whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.preview.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      {preview.columns.map((col) => (
                        <TableCell
                          key={col}
                          className="text-xs whitespace-nowrap"
                        >
                          {String(row[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
