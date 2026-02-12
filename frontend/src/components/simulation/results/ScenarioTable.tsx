import type { ScenarioTableData } from "@/types/simulation";
import { ResultCard } from "./ResultCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioTableProps {
  data: ScenarioTableData | null;
  loading?: boolean;
  simulationName?: string;
}

const formatDollar = (v: number) => {
  const sign = v >= 0 ? "+" : "";
  if (Math.abs(v) >= 1000000) return `${sign}$${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${sign}$${(v / 1000).toFixed(0)}K`;
  return `${sign}$${v}`;
};

const scenarioKey = (name: string): "best" | "base" | "worst" => {
  const lower = name.toLowerCase();
  if (lower.includes("best") || lower.includes("optimistic")) return "best";
  if (lower.includes("worst") || lower.includes("pessimistic")) return "worst";
  return "base";
};

export const ScenarioTable = ({
  data,
  loading,
  simulationName,
}: ScenarioTableProps) => {
  if (!data && !loading) return null;

  return (
    <ResultCard
      title={data?.title ?? "Scenario Comparison"}
      subtitle="Best, base, and worst case analysis"
      pinId={simulationName ? `sim-scenarios-${simulationName}` : undefined}
      loading={loading}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Scenario</TableHead>
            <TableHead>Revenue Impact</TableHead>
            <TableHead>Customers</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead>Probability</TableHead>
            <TableHead>Key Assumption</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.scenarios.map((s) => {
            const key = scenarioKey(s.name);
            const isRecommended = data.recommendation === key;
            return (
              <TableRow
                key={s.name}
                className={cn(isRecommended && "bg-primary/5")}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {s.name}
                    {isRecommended && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary"
                      >
                        Rec.
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "font-medium",
                      s.revenue_impact >= 0
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {formatDollar(s.revenue_impact)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      s.customer_impact >= 0
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {s.customer_impact >= 0 ? "+" : ""}
                    {s.customer_impact}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.timeline}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(s.probability * 100)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {s.key_assumption}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ResultCard>
  );
};
