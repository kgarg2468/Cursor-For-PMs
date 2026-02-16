import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useInsightStore } from "@/stores/insightStore";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import type { SortBy } from "@/stores/insightStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, RefreshCw, ArrowUpDown, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInsights } from "@/hooks/useInsights";
import { KPIMetrics } from "@/components/dashboard/KPIMetrics";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { ActionPlanView } from "@/components/dashboard/ActionPlanView";
import { CollapsibleReasoningFeed } from "@/components/activity/CollapsibleReasoningFeed";
import type { InsightType } from "@/lib/api";

const TYPE_LABELS: Record<InsightType, string> = {
  alert: "Alert",
  opportunity: "Opportunity",
  trend: "Trend",
  anomaly: "Anomaly",
  correlation: "Correlation",
  segment: "Segment",
  feature_adoption: "Adoption",
  revenue_attribution: "Revenue",
};

export const DashboardPage = () => {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const typeFilter = useInsightStore((s) => s.typeFilter);
  const sortBy = useInsightStore((s) => s.sortBy);
  const setTypeFilter = useInsightStore((s) => s.setTypeFilter);
  const setSortBy = useInsightStore((s) => s.setSortBy);
  const planActions = useActionPlanStore((s) => s.planActions);
  const navigate = useNavigate();
  const [dashboardTab, setDashboardTab] = useState<string>("insights");
  const {
    insights,
    kpis,
    isGenerating,
    regenerate,
  } = useInsights();

  // Compute existing types from current insights (for filter tabs)
  const existingTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of insights) {
      counts.set(i.type, (counts.get(i.type) ?? 0) + 1);
    }
    return counts;
  }, [insights]);

  // Filter + sort client-side
  const filteredInsights = useMemo(() => {
    let result = insights;
    if (typeFilter) {
      result = result.filter((i) => i.type === typeFilter);
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "impact_score":
          return (b.impact_score ?? 0) - (a.impact_score ?? 0);
        case "impact_revenue":
          return Math.abs(b.impact_revenue ?? 0) - Math.abs(a.impact_revenue ?? 0);
        case "created_at":
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        default:
          return 0;
      }
    });
  }, [insights, typeFilter, sortBy]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Insight Autopilot
          </h1>
          <p className="text-muted-foreground max-w-md">
            Upload your product data or try with our sample dataset. AI will
            automatically analyze it and surface actionable insights.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/data")} size="lg">
            Upload Data
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/data")}
          >
            Try Sample Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alert Banner */}
      {!isGenerating && insights.length > 0 && (
        <AlertBanner insights={insights} />
      )}

      {/* KPI Row */}
      <KPIMetrics kpis={kpis} isLoading={isGenerating && !kpis} />

      {/* Generation Progress — Activity Feed */}
      <CollapsibleReasoningFeed flowType="insight-generation" />

      {/* Dashboard Tabs: Insights + Action Plan */}
      {(insights.length > 0 || !isGenerating) && (
        <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="insights" className="gap-1.5">
                <Sparkles className="h-3 w-3" />
                Insights ({insights.length})
              </TabsTrigger>
              <TabsTrigger value="action-plan" className="gap-1.5">
                <ClipboardList className="h-3 w-3" />
                Action Plan ({planActions.length})
              </TabsTrigger>
            </TabsList>

            {dashboardTab === "insights" && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ArrowUpDown className="h-3 w-3" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as SortBy)}
                    >
                      <DropdownMenuRadioItem value="impact_score">
                        Impact Score
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="impact_revenue">
                        Revenue Impact
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="created_at">
                        Newest First
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerate}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="insights" className="mt-0">
            {/* Type filter tabs */}
            {insights.length > 0 && existingTypes.size > 1 && (
              <Tabs
                value={typeFilter ?? "all"}
                onValueChange={(v) => setTypeFilter(v === "all" ? null : v)}
                className="mb-4"
              >
                <TabsList>
                  <TabsTrigger value="all">
                    All ({insights.length})
                  </TabsTrigger>
                  {Array.from(existingTypes.entries()).map(([type, count]) => (
                    <TabsTrigger key={type} value={type}>
                      {TYPE_LABELS[type as InsightType] ?? type} ({count})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {insights.length === 0 && !isGenerating && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No insights yet.</p>
                <p className="text-xs mt-1">
                  Click Regenerate to analyze your data with AI.
                </p>
              </div>
            )}

            <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
              {filteredInsights.map((insight) => (
                <div key={insight.id} className="break-inside-avoid">
                  <InsightCard insight={insight} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="action-plan" className="mt-0">
            <ActionPlanView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
