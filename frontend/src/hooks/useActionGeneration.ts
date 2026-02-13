import { useCallback, useRef } from "react";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import { insightsApi } from "@/lib/api";
import type { ActionItemResponse } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";

export function useActionGeneration() {
  const {
    wizardActions,
    isGeneratingActions,
    actionThinkingSteps,
    addWizardAction,
    setIsGeneratingActions,
    addActionThinkingStep,
    setWizardActions,
    clearActionGeneration,
  } = useActionPlanStore();

  const connectionRef = useRef<SSEConnection | null>(null);

  const generate = useCallback(
    (insightId: string) => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }

      clearActionGeneration();
      setIsGeneratingActions(true);

      const url = insightsApi.generateActionsUrl(insightId);
      connectionRef.current = connectPostSSE(
        url,
        (event) => {
          switch (event.type) {
            case "thinking":
              addActionThinkingStep(event.data.content as string);
              break;
            case "progress":
              addActionThinkingStep(event.data.step as string);
              break;
            case "action":
              addWizardAction(event.data as unknown as ActionItemResponse);
              break;
            case "complete":
              setIsGeneratingActions(false);
              connectionRef.current = null;
              break;
            case "error":
              setIsGeneratingActions(false);
              connectionRef.current = null;
              break;
          }
        },
        () => {
          setIsGeneratingActions(false);
          connectionRef.current = null;
        },
        () => {
          connectionRef.current = null;
        }
      );
    },
    [clearActionGeneration, setIsGeneratingActions, addActionThinkingStep, addWizardAction]
  );

  const loadCached = useCallback(
    async (insightId: string): Promise<boolean> => {
      try {
        const actions = await insightsApi.listActions(insightId);
        if (actions.length > 0) {
          setWizardActions(actions);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [setWizardActions]
  );

  const stop = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsGeneratingActions(false);
  }, [setIsGeneratingActions]);

  return {
    wizardActions,
    isGeneratingActions,
    actionThinkingSteps,
    generate,
    loadCached,
    stop,
  };
}
