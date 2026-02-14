import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail,
  FileText,
  Ticket,
  FileCode,
  Download,
  Copy,
  Eye,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Artifact {
  type: "email" | "pdf" | "jira_ticket" | "prd";
  title: string;
  content: string;
  metadata?: {
    recipients?: string[];
    priority?: string;
    labels?: string[];
    sections?: string[];
  };
}

interface ArtifactPreviewProps {
  artifacts: Artifact[];
}

const typeIcons = {
  email: Mail,
  pdf: FileText,
  jira_ticket: Ticket,
  prd: FileCode,
};

const typeLabels = {
  email: "Email Draft",
  pdf: "PDF Proposal",
  jira_ticket: "Jira Ticket",
  prd: "PRD Document",
};

export const ArtifactPreview = ({ artifacts }: ArtifactPreviewProps) => {
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (artifacts.length === 0) return null;

  // Group artifacts by type
  const grouped = artifacts.reduce(
    (acc, artifact, idx) => {
      const key = artifact.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ ...artifact, _id: `artifact-${idx}` });
      return acc;
    },
    {} as Record<string, Array<Artifact & { _id: string }>>,
  );

  const toggleExpand = (id: string) => {
    setExpandedArtifacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = (content: string, title: string, type: string) => {
    const blob = new Blob([content], {
      type: type === "pdf" ? "application/pdf" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-")}.${type === "pdf" ? "pdf" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderEmailContent = (content: string) => {
    // Simple email rendering - convert line breaks and basic formatting
    const lines = content.split("\n");
    return (
      <div className="text-xs text-muted-foreground space-y-2">
        {lines.map((line, i) => {
          if (line.startsWith("Subject:")) {
            return (
              <div key={i} className="font-semibold text-foreground">
                {line}
              </div>
            );
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return (
              <div key={i} className="font-medium text-foreground mt-3">
                {line.replace(/\*\*/g, "")}
              </div>
            );
          }
          return <div key={i}>{line || <br />}</div>;
        })}
      </div>
    );
  };

  const renderJiraTicket = (content: string) => {
    try {
      const ticket = JSON.parse(content);
      return (
        <div className="space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Summary
            </div>
            <div className="text-foreground font-medium">{ticket.summary}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </div>
            <div className="text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>
          {ticket.priority && (
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Priority:
              </div>
              <Badge variant="outline" className="text-xs">
                {ticket.priority}
              </Badge>
            </div>
          )}
          {ticket.labels && ticket.labels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Labels:
              </div>
              {ticket.labels.map((label: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    } catch {
      return (
        <div className="text-xs text-muted-foreground whitespace-pre-wrap">
          {content}
        </div>
      );
    }
  };

  const renderPRD = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="text-xs text-muted-foreground space-y-3">
        {lines.map((line, i) => {
          if (line.startsWith("# ")) {
            return (
              <h1 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">
                {line.slice(2)}
              </h1>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <li key={i} className="ml-4 list-disc">
                {line.slice(2)}
              </li>
            );
          }
          return <div key={i}>{line || <br />}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Generated Artifacts</h3>
        <Badge variant="outline" className="text-xs">
          {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Tabs defaultValue={Object.keys(grouped)[0]}>
        <TabsList>
          {Object.keys(grouped).map((type) => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            return (
              <TabsTrigger key={type} value={type} className="gap-2">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {typeLabels[type as keyof typeof typeLabels]} ({grouped[type].length})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(grouped).map(([type, items]) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-4">
            {items.map((artifact) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              const isExpanded = expandedArtifacts.has(artifact._id);
              const isCopied = copiedId === artifact._id;

              return (
                <Card key={artifact._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
                        <CardTitle className="text-sm truncate">{artifact.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Preview */}
                    <div
                      className={cn(
                        "text-xs text-muted-foreground",
                        !isExpanded && "line-clamp-4",
                      )}
                    >
                      {type === "email" && renderEmailContent(artifact.content)}
                      {type === "jira_ticket" && renderJiraTicket(artifact.content)}
                      {type === "prd" && renderPRD(artifact.content)}
                      {(type === "pdf" || (!type)) && (
                        <div className="whitespace-pre-wrap">{artifact.content}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => toggleExpand(artifact._id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Expand
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleCopy(artifact.content, artifact._id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {isCopied ? "Copied!" : "Copy"}
                      </Button>
                      {(type === "pdf" || type === "prd") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            handleDownload(artifact.content, artifact.title, type)
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
