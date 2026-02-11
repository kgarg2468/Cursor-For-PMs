import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pin, X, ChevronDown, ChevronUp, Loader2, MessageSquare,
  AlertTriangle, Lightbulb, TrendingUp, Activity, Link2, Users, Boxes, DollarSign,
} from "lucide-react";
import type { InsightResponse, InsightType } from "@/lib/api";
import { insightsApi } from "@/lib/api";
import { useInsightStore } from "@/stores/insightStore";
import { useChatStore } from "@/stores/chatStore";
import { useAppStore } from "@/stores/appStore";
import { MiniChart } from "./MiniChart";

interface InsightCardProps {
  insight: InsightResponse;
}

const typeConfig: Record<
  InsightType,
  {
    color: string;
    border: string;
    chartColor: string;
    label: string;
    icon: typeof AlertTriangle;
  }
> = {
  alert: {
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    border: "border-amber-500/20 bg-amber-500/5",
    chartColor: "amber",
    label: "Alert",
    icon: AlertTriangle,
  },
  opportunity: {
    color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    border: "border-emerald-500/20 bg-emerald-500/5",
    chartColor: "emerald",
    label: "Opportunity",
    icon: Lightbulb,
  },
  trend: {
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    border: "border-blue-500/20 bg-blue-500/5",
    chartColor: "blue",
    label: "Trend",
    icon: TrendingUp,
  },
  anomaly: {
    color: "bg-red-500/20 text-red-500 border-red-500/30",
    border: "border-red-500/20 bg-red-500/5",
    chartColor: "red",
    label: "Anomaly",
    icon: Activity,
  },
  correlation: {
    color: "bg-violet-500/20 text-violet-500 border-violet-500/30",
    border: "border-violet-500/20 bg-violet-500/5",
    chartColor: "violet",
    label: "Correlation",
    icon: Link2,
  },
  segment: {
    color: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
    border: "border-cyan-500/20 bg-cyan-500/5",
    chartColor: "cyan",
    label: "Segment",
    icon: Users,
  },
  feature_adoption: {
    color: "bg-pink-500/20 text-pink-500 border-pink-500/30",
    border: "border-pink-500/20 bg-pink-500/5",
    chartColor: "pink",
    label: "Adoption",
    icon: Boxes,
  },
  revenue_attribution: {
    color: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    border: "border-orange-500/20 bg-orange-500/5",
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

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={i} className="text-xs text-muted-foreground ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    }
  }
  return elements;
};

export const InsightCard = ({ insight }: InsightCardProps) => {
  const dismissInsight = useInsightStore((s) => s.dismissInsight);
  const pinCard = useChatStore((s) => s.pinCard);
  const setDraftMessage = useChatStore((s) => s.setDraftMessage);
  const setSidePanelOpen = useAppStore((s) => s.setSidePanelOpen);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingReasoning, setIsLoadingReasoning] = useState(false);
  const [reasoning, setReasoning] = useState<string | null>(insight.ai_reasoning ?? null);

  const config = typeConfig[insight.type] ?? typeConfig.trend;
  const TypeIcon = config.icon;
  const suggestedQuestions = insight.suggested_questions;
  const revenueLabel = formatRevenue(insight.impact_revenue);

  const chartData = insight.chart_data as {
    type: "bar" | "line";
    labels: string[];
    values: number[];
  } | null;

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

  const handleToggleExpand = async () => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);

    if (willExpand && !reasoning && !isLoadingReasoning) {
      setIsLoadingReasoning(true);
      try {
        const result = await insightsApi.expand(insight.id);
        setReasoning(result.ai_reasoning);
      } catch {
        setReasoning("Failed to load detailed analysis. Please try again.");
      } finally {
        setIsLoadingReasoning(false);
      }
    }
  };

  return (
    <Card className={`${config.border} !py-0 !gap-0`}>
      {/* Collapsed content — always visible */}
      <div className="px-4 py-3">
        {/* Row 1: Type badge + title + mini chart */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Badge className={`${config.color} shrink-0 text-xs px-1.5 py-0 gap-1`}>
              <TypeIcon className="h-2.5 w-2.5" />
              {config.label}
            </Badge>
            <span className="text-sm font-semibold">{insight.title}</span>
          </div>
          <div className="shrink-0">
            <MiniChart chartData={chartData} color={config.chartColor} />
          </div>
        </div>

        {/* Description */}
        {insight.description && (
          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
        )}

        {/* Row 2: Impact badges + actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {revenueLabel && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {revenueLabel} MRR
              </Badge>
            )}
            {insight.impact_customers != null && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {insight.impact_customers} accts
              </Badge>
            )}
            {insight.confidence != null && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {Math.round(insight.confidence * 100)}%
              </Badge>
            )}
            {insight.impact_score != null && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30">
                {Math.round(insight.impact_score)} impact
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleToggleExpand}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded content — accordion */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3">
          {isLoadingReasoning ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating detailed analysis...
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : reasoning ? (
            <div>{renderMarkdown(reasoning)}</div>
          ) : null}

          {/* Suggested questions — shown only in expanded view */}
          {suggestedQuestions && suggestedQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted hover:bg-accent rounded-full px-2 py-0.5 transition-colors cursor-pointer"
                  onClick={() => {
                    setDraftMessage(q);
                    setSidePanelOpen(true);
                  }}
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
