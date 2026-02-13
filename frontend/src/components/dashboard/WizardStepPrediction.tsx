import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, DollarSign, Users, Target } from "lucide-react";
import type { InsightResponse } from "@/lib/api";
import { InsightChart } from "./InsightChart";

interface WizardStepPredictionProps {
  insight: InsightResponse;
  onNext: () => void;
}

const typeChartColors: Record<string, string> = {
  alert: "amber",
  opportunity: "emerald",
  trend: "blue",
  anomaly: "red",
  correlation: "violet",
  segment: "cyan",
  feature_adoption: "pink",
  revenue_attribution: "orange",
};

const formatRevenue = (value: number | null): string | null => {
  if (value == null) return null;
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(0)}K`;
  return `${prefix}$${abs.toFixed(0)}`;
};

export const WizardStepPrediction = ({
  insight,
  onNext,
}: WizardStepPredictionProps) => {
  const headline = insight.prediction || insight.description;
  const detail = insight.prediction_detail;
  const revenueLabel = formatRevenue(insight.impact_revenue);
  const chartColor = typeChartColors[insight.type] || "blue";

  const chartData = insight.chart_data as {
    type: "bar" | "line";
    labels: string[];
    values: number[];
  } | null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Prediction headline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Prediction
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug">{headline}</h3>
        </div>

        {/* Detail */}
        {detail && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {detail}
          </p>
        )}

        {/* Chart */}
        {chartData && (
          <InsightChart chartData={chartData} color={chartColor} />
        )}

        {/* Impact badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {revenueLabel && (
            <Badge variant="outline" className="gap-1 text-xs">
              <DollarSign className="h-3 w-3" />
              {revenueLabel} MRR
            </Badge>
          )}
          {insight.impact_customers != null && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {insight.impact_customers} accounts
            </Badge>
          )}
          {insight.confidence != null && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Target className="h-3 w-3" />
              {Math.round(insight.confidence * 100)}% confidence
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button onClick={onNext} className="w-full gap-2">
          Next: See Reasoning
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
