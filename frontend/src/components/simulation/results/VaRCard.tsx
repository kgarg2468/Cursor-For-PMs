import { ShieldAlert, TrendingDown, TrendingUp, Target } from "lucide-react";
import type { VaRCardData } from "@/types/simulation";
import { ResultCard } from "./ResultCard";
import { Badge } from "@/components/ui/badge";

interface VaRCardProps {
  data: VaRCardData | null;
  loading?: boolean;
  simulationName?: string;
}

const formatDollar = (v: number) => {
  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

export const VaRCard = ({ data, loading, simulationName }: VaRCardProps) => {
  if (!data && !loading) return null;

  return (
    <ResultCard
      title={data?.title ?? "Value at Risk"}
      pinId={simulationName ? `sim-var-${simulationName}` : undefined}
      loading={loading}
    >
      <div className="space-y-4">
        {/* Main VaR number */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/15 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {data ? formatDollar(data.var_amount) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.var_description ?? "Maximum expected loss"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Expected
              </span>
            </div>
            <div className="text-sm font-medium">
              {data ? formatDollar(data.expected_value) : "--"}
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground">
                Best Case
              </span>
            </div>
            <div className="text-sm font-medium text-emerald-400">
              {data ? formatDollar(data.best_case) : "--"}
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-muted-foreground">
                Confidence
              </span>
            </div>
            <div className="text-sm font-medium">
              {data ? `${data.confidence_level}%` : "--"}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {data?.recommendation && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge
                variant="secondary"
                className="text-[10px] bg-primary/15 text-primary"
              >
                Recommendation
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        )}
      </div>
    </ResultCard>
  );
};
