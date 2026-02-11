import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, X, MessageSquare } from "lucide-react";
import type { InsightResponse } from "@/lib/api";
import { insightsApi } from "@/lib/api";
import { useInsightStore } from "@/stores/insightStore";
import { useChatStore } from "@/stores/chatStore";

interface InsightCardProps {
  insight: InsightResponse;
  suggestedQuestions?: string[];
}

const typeConfig = {
  alert: {
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    border: "border-amber-500/20 bg-amber-500/5",
    label: "Alert",
  },
  opportunity: {
    color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    border: "border-emerald-500/20 bg-emerald-500/5",
    label: "Opportunity",
  },
  trend: {
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    border: "border-blue-500/20 bg-blue-500/5",
    label: "Trend",
  },
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

const formatRevenue = (value: number | null): string | null => {
  if (value == null) return null;
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(0)}K`;
  return `${prefix}$${abs.toFixed(0)}`;
};

export const InsightCard = ({ insight, suggestedQuestions }: InsightCardProps) => {
  const dismissInsight = useInsightStore((s) => s.dismissInsight);
  const pinCard = useChatStore((s) => s.pinCard);

  const config = typeConfig[insight.type] || typeConfig.trend;

  const handleDismiss = async () => {
    dismissInsight(insight.id);
    try {
      await insightsApi.dismiss(insight.id);
    } catch {
      // Best effort
    }
  };

  const handlePin = () => {
    pinCard(insight.id);
  };

  const revenueLabel = formatRevenue(insight.impact_revenue);

  return (
    <Card className={config.border}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={config.color}>{config.label}</Badge>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {priorityLabels[insight.priority] || insight.priority}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePin}
              title="Pin to chat"
            >
              <Pin className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-sm mt-2">{insight.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {insight.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {revenueLabel && (
            <Badge variant="outline" className="text-xs">
              {revenueLabel} MRR impact
            </Badge>
          )}
          {insight.impact_customers != null && (
            <Badge variant="outline" className="text-xs">
              {insight.impact_customers} accounts
            </Badge>
          )}
          {insight.confidence != null && (
            <Badge variant="outline" className="text-xs">
              {Math.round(insight.confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted hover:bg-accent rounded-full px-2 py-0.5 transition-colors"
              >
                <MessageSquare className="h-2.5 w-2.5" />
                {q}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
