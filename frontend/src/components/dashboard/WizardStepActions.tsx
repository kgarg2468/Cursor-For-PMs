import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle2, FlaskConical } from "lucide-react";
import { useActionGeneration } from "@/hooks/useActionGeneration";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import { useSimulationStore } from "@/stores/simulationStore";
import { insightsApi } from "@/lib/api";
import { ActionCard } from "./ActionCard";

interface WizardStepActionsProps {
  insightId: string;
}

export const WizardStepActions = ({ insightId }: WizardStepActionsProps) => {
  const navigate = useNavigate();
  const {
    wizardActions,
    isGeneratingActions,
    actionThinkingSteps,
    generate,
    loadCached,
  } = useActionGeneration();

  const togglePlanAction = useActionPlanStore((s) => s.togglePlanAction);
  const addActionsToPlan = useActionPlanStore((s) => s.addActionsToPlan);
  const closeWizard = useActionPlanStore((s) => s.closeWizard);
  const setAgenticMode = useSimulationStore((s) => s.setAgenticMode);
  const [initialized, setInitialized] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isTriggeringSimulation, setIsTriggeringSimulation] = useState(false);
  const initRef = useRef(false);

  // On mount: check cached → if none, generate
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      const hasCached = await loadCached(insightId);
      if (!hasCached) {
        generate(insightId);
      }
      setInitialized(true);
    })();
  }, [insightId, loadCached, generate]);

  const handleTogglePlan = async (actionId: string) => {
    togglePlanAction(actionId);
    try {
      await insightsApi.toggleActionPlan(actionId);
    } catch {
      // Revert on failure
      togglePlanAction(actionId);
    }
  };

  const handleAddSelectedToPlan = async () => {
    const toAdd = wizardActions.filter((a) => !a.added_to_plan);
    if (toAdd.length === 0) return;

    setSavingPlan(true);
    // Update store immediately so Action Plan tab shows items right away
    addActionsToPlan(toAdd);
    let count = 0;
    for (const action of toAdd) {
      try {
        await insightsApi.toggleActionPlan(action.id);
        count++;
      } catch {
        // Revert this action in store on API failure
        togglePlanAction(action.id);
      }
    }
    setSavedCount(count);
    setSavingPlan(false);
  };

  const handleRunSimulation = () => {
    setIsTriggeringSimulation(true);
    try {
      setAgenticMode(true, insightId);
      closeWizard(); // Close wizard so simulations page gets full width
      navigate(`/simulations?mode=agentic&insightId=${insightId}`);
    } catch (error) {
      console.error("Failed to trigger simulation:", error);
    } finally {
      setIsTriggeringSimulation(false);
    }
  };

  const thinkingText = actionThinkingSteps.join("");
  const addedCount = wizardActions.filter((a) => a.added_to_plan).length;
  const notAddedCount = wizardActions.length - addedCount;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Recommended Actions
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleRunSimulation}
            disabled={isTriggeringSimulation}
          >
            {isTriggeringSimulation ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <FlaskConical className="h-3.5 w-3.5" />
                Run Strategic Simulation
              </>
            )}
          </Button>
        </div>

        {/* Thinking animation */}
        {isGeneratingActions && thinkingText && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-medium">Thinking...</span>
            </div>
            <p className="truncate">{thinkingText.slice(-120)}</p>
          </div>
        )}

        {/* Loading state */}
        {!initialized || (isGeneratingActions && wizardActions.length === 0) ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating action items...
            </div>
          </div>
        ) : null}

        {/* Action cards */}
        {wizardActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onTogglePlan={handleTogglePlan}
          />
        ))}

        {/* Success message */}
        {savedCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 rounded-md px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {savedCount} action{savedCount !== 1 ? "s" : ""} added to your Action Plan
          </div>
        )}
      </div>

      {/* Footer */}
      {wizardActions.length > 0 && notAddedCount > 0 && (
        <div className="border-t border-border p-4">
          <Button
            onClick={handleAddSelectedToPlan}
            className="w-full gap-2"
            disabled={savingPlan || isGeneratingActions}
          >
            {savingPlan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add All to Action Plan ({notAddedCount})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
