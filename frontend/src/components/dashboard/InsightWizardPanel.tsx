import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import { useInsightStore } from "@/stores/insightStore";
import type { InsightType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { WizardStepPrediction } from "./WizardStepPrediction";
import { WizardStepReasoning } from "./WizardStepReasoning";
import { WizardStepActions } from "./WizardStepActions";

const STEPS = [
  { label: "Prediction", short: "1" },
  { label: "Reasoning", short: "2" },
  { label: "Actions", short: "3" },
] as const;

const typeBadgeColors: Record<string, string> = {
  alert: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  opportunity: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  trend: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  anomaly: "bg-red-500/20 text-red-500 border-red-500/30",
  correlation: "bg-violet-500/20 text-violet-500 border-violet-500/30",
  segment: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  feature_adoption: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  revenue_attribution: "bg-orange-500/20 text-orange-500 border-orange-500/30",
};

const typeLabels: Record<InsightType, string> = {
  alert: "Alert",
  opportunity: "Opportunity",
  trend: "Trend",
  anomaly: "Anomaly",
  correlation: "Correlation",
  segment: "Segment",
  feature_adoption: "Adoption",
  revenue_attribution: "Revenue",
};

export const InsightWizardPanel = () => {
  const wizardOpen = useActionPlanStore((s) => s.wizardOpen);
  const selectedInsightId = useActionPlanStore((s) => s.selectedInsightId);
  const wizardStep = useActionPlanStore((s) => s.wizardStep);
  const closeWizard = useActionPlanStore((s) => s.closeWizard);
  const setWizardStep = useActionPlanStore((s) => s.setWizardStep);
  const insights = useInsightStore((s) => s.insights);

  if (!wizardOpen || !selectedInsightId) return null;

  const insight = insights.find((i) => i.id === selectedInsightId);
  if (!insight) return null;

  const badgeColor = typeBadgeColors[insight.type] || typeBadgeColors.trend;

  return (
    <div className="w-[400px] shrink-0 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={cn("text-xs px-1.5 py-0 shrink-0", badgeColor)}>
              {typeLabels[insight.type] || insight.type}
            </Badge>
            <span className="text-sm font-medium truncate">{insight.title}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={closeWizard}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setWizardStep(idx as 0 | 1 | 2)}
              className="flex items-center gap-1 group"
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  idx === wizardStep
                    ? "bg-primary text-primary-foreground"
                    : idx < wizardStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.short}
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  idx === wizardStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-px mx-1",
                    idx < wizardStep ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {wizardStep === 0 && (
          <WizardStepPrediction
            insight={insight}
            onNext={() => setWizardStep(1)}
          />
        )}
        {wizardStep === 1 && (
          <WizardStepReasoning
            insight={insight}
            onNext={() => setWizardStep(2)}
          />
        )}
        {wizardStep === 2 && (
          <WizardStepActions insightId={insight.id} />
        )}
      </div>
    </div>
  );
};
