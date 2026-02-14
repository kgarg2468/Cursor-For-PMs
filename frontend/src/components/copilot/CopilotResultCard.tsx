import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Pin,
  LayoutDashboard,
  X,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Activity,
  Link2,
  Users,
  Boxes,
  DollarSign,
} from "lucide-react";
import type { InsightResponse, InsightType } from "@/lib/api";
import { InsightChart } from "@/components/dashboard/InsightChart";

interface CopilotResultCardProps {
  insight: InsightResponse;
  onRunSimulation: () => void;
  onPinToChat: () => void;
  onSaveToDashboard: () => void;
  onDismiss: () => void;
}

const typeConfig: Record<
  InsightType,
  { color: string; border: string; chartColor: string; label: string; icon: typeof AlertTriangle }
> = {
  alert: {
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    border: "border-amber-500/30",
    chartColor: "amber",
    label: "Alert",
    icon: AlertTriangle,
  },
  opportunity: {
    color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    border: "border-emerald-500/30",
    chartColor: "emerald",
    label: "Opportunity",
    icon: Lightbulb,
  },
  trend: {
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    border: "border-blue-500/30",
    chartColor: "blue",
    label: "Trend",
    icon: TrendingUp,
  },
  anomaly: {
    color: "bg-red-500/20 text-red-500 border-red-500/30",
    border: "border-red-500/30",
    chartColor: "red",
    label: "Anomaly",
    icon: Activity,
  },
  correlation: {
    color: "bg-violet-500/20 text-violet-500 border-violet-500/30",
    border: "border-violet-500/30",
    chartColor: "violet",
    label: "Correlation",
    icon: Link2,
  },
  segment: {
    color: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
    border: "border-cyan-500/30",
    chartColor: "cyan",
    label: "Segment",
    icon: Users,
  },
  feature_adoption: {
    color: "bg-pink-500/20 text-pink-500 border-pink-500/30",
    border: "border-pink-500/30",
    chartColor: "pink",
    label: "Adoption",
    icon: Boxes,
  },
  revenue_attribution: {
    color: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    border: "border-orange-500/30",
    chartColor: "orange",
    label: "Revenue",
    icon: DollarSign,
  },
};

const formatRevenue = (value: number | null): string | null => {
  if (value == null) return null;
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(0)}K`;
  return `${prefix}$${abs.toFixed(0)}`;
};

export const CopilotResultCard = ({
  insight,
  onRunSimulation,
  onPinToChat,
  onSaveToDashboard,
  onDismiss,
}: CopilotResultCardProps) => {
  const config = typeConfig[insight.type] ?? typeConfig.trend;
  const TypeIcon = config.icon;
  const revenueLabel = formatRevenue(insight.impact_revenue);

  const chartData = insight.chart_data as {
    type: "bar" | "line";
    labels: string[];
    values: number[];
  } | null;

  return (
    <Card
      className={`${config.border} w-full max-w-xl bg-card/95 backdrop-blur-sm !py-0 !gap-0 shadow-lg`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={`${config.color} shrink-0 text-xs px-2 py-0.5 gap-1`}>
              <TypeIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {insight.priority === "critical" && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                Critical
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h3 className="text-base font-semibold mt-2">{insight.title}</h3>
        {insight.description && (
          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
        )}
      </div>

      {/* Prediction */}
      {insight.prediction && (
        <div className="px-5 pb-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs text-primary/80 font-medium">{insight.prediction}</p>
            {insight.prediction_detail && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {insight.prediction_detail}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && (
        <div className="px-5 pb-3">
          <InsightChart chartData={chartData} color={config.chartColor} />
        </div>
      )}

      {/* Impact badges */}
      <div className="px-5 pb-3 flex items-center gap-1.5 flex-wrap">
        {revenueLabel && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {revenueLabel} MRR
          </Badge>
        )}
        {insight.impact_customers != null && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {insight.impact_customers} accounts
          </Badge>
        )}
        {insight.confidence != null && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {Math.round(insight.confidence * 100)}% confidence
          </Badge>
        )}
        {insight.impact_score != null && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-primary border-primary/30">
            {Math.round(insight.impact_score)} impact
          </Badge>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-border px-5 py-3 flex items-center gap-2">
        <Button size="sm" onClick={onRunSimulation} className="gap-1.5">
          <FlaskConical className="h-3.5 w-3.5" />
          Run Simulation
        </Button>
        <Button size="sm" variant="outline" onClick={onPinToChat} className="gap-1.5">
          <Pin className="h-3.5 w-3.5" />
          Pin to Chat
        </Button>
        <Button size="sm" variant="outline" onClick={onSaveToDashboard} className="gap-1.5">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Save to Dashboard
        </Button>
      </div>
    </Card>
  );
};
