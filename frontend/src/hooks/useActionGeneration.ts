import { useCallback, useRef } from "react";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
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
  const feedStore = useActivityFeedStore;
  const hasSeenThinking = useRef(false);
  const hasSeenAction = useRef(false);

  const generate = useCallback(
    (insightId: string) => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }

      clearActionGeneration();
      setIsGeneratingActions(true);
      hasSeenThinking.current = false;
      hasSeenAction.current = false;

      // Start activity feed with multi-step flow
      const store = feedStore.getState();
      store.startFeed("copilot", `action-gen-${insightId}`);
      store.addStep({
        id: "action-context",
        status: "running",
        icon: "Search",
        title: "Loading context",
        subtitle: "Retrieving insight data and dataset summary...",
        subTasks: [],
      });

      const url = insightsApi.generateActionsUrl(insightId);
      connectionRef.current = connectPostSSE(
        url,
        (event) => {
          const fs = feedStore.getState();
          switch (event.type) {
            case "thinking": {
              addActionThinkingStep(event.data.content as string);
              if (!hasSeenThinking.current) {
                hasSeenThinking.current = true;
                fs.completeStep("action-context");
                fs.addStep({
                  id: "action-thinking",
                  status: "running",
                  icon: "Brain",
                  title: "Reasoning through actions",
                  subtitle: "Analyzing insight for recommended actions...",
                  subTasks: [],
                });
              }
              fs.appendThinking(
                "action-thinking",
                (event.data.content as string) ?? ""
              );
              break;
            }
            case "progress":
              addActionThinkingStep(event.data.step as string);
              // Update subtitle of current running step
              if (hasSeenThinking.current && !hasSeenAction.current) {
                fs.updateStep("action-thinking", {
                  subtitle: event.data.step as string,
                });
              }
              break;
            case "action": {
              const actionData = event.data as unknown as ActionItemResponse;
              addWizardAction(actionData);
              if (!hasSeenAction.current) {
                hasSeenAction.current = true;
                if (hasSeenThinking.current) {
                  fs.completeStep("action-thinking");
                } else {
                  fs.completeStep("action-context");
                }
                fs.addStep({
                  id: "action-build",
                  status: "running",
                  icon: "Sparkles",
                  title: "Building action items",
                  subtitle: "Creating recommended actions...",
                  subTasks: [],
                });
              }
              fs.addSubTask("action-build", {
                id: `action-${actionData.id ?? Date.now()}`,
                label: actionData.title ?? "Action item",
                status: "completed",
              });
              break;
            }
            case "complete":
              setIsGeneratingActions(false);
              connectionRef.current = null;
              fs.completeStep("action-build");
              fs.completeFeed();
              break;
            case "error":
              setIsGeneratingActions(false);
              connectionRef.current = null;
              // Error whichever step is currently running
              if (hasSeenAction.current) {
                fs.setStepError("action-build");
              } else if (hasSeenThinking.current) {
                fs.setStepError("action-thinking");
              } else {
                fs.setStepError("action-context");
              }
              fs.completeFeed();
              break;
          }
        },
        () => {
          setIsGeneratingActions(false);
          connectionRef.current = null;
          feedStore.getState().completeFeed();
        },
        () => {
          connectionRef.current = null;
        }
      );
    },
    [clearActionGeneration, setIsGeneratingActions, addActionThinkingStep, addWizardAction, feedStore]
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
