import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInsights } from "@/hooks/useInsights";
import { KPIMetrics } from "@/components/dashboard/KPIMetrics";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { GenerationProgress } from "@/components/dashboard/GenerationProgress";

export const DashboardPage = () => {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const navigate = useNavigate();
  const {
    insights,
    kpis,
    isGenerating,
    generationProgress,
    thinkingSteps,
    regenerate,
  } = useInsights();

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

      {/* Generation Progress */}
      {isGenerating && (
        <GenerationProgress
          progress={generationProgress}
          thinkingSteps={thinkingSteps}
        />
      )}

      {/* Insights Section */}
      {(insights.length > 0 || !isGenerating) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
            <div className="flex items-center gap-2">
              {insights.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {insights.length} insights
                </Badge>
              )}
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
          </div>

          {insights.length === 0 && !isGenerating && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No insights yet.</p>
              <p className="text-xs mt-1">
                Click Regenerate to analyze your data with AI.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                suggestedQuestions={
                  (insight as unknown as Record<string, unknown>)
                    .suggested_questions as string[] | undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
