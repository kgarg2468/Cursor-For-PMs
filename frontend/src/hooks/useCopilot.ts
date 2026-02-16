import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { useCopilotStore } from "@/stores/copilotStore";
import { useInsightStore } from "@/stores/insightStore";
import { useChatStore } from "@/stores/chatStore";
import { useSimulationStore, type SimulationState } from "@/stores/simulationStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { mapCopilotEvent } from "@/lib/activityMappers";
import { copilotApi, simulationsApi } from "@/lib/api";
import type { InsightResponse } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";

export function useCopilot() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeDataset = useAppStore((s) => s.activeDataset);
  const setCommandBarOpen = useAppStore((s) => s.setCommandBarOpen);

  const {
    phase,
    userPrompt,
    classification,
    quickAnswerText,
    quickAnswerDone,
    progressMessage,
    generatedInsight,
    generatedInsightId,
    errorMessage,
    setPhase,
    setUserPrompt,
    setClassification,
    appendQuickAnswer,
    setQuickAnswerDone,
    setProgressMessage,
    setGeneratedInsight,
    setGeneratedInsightId,
    setErrorMessage,
    reset,
  } = useCopilotStore();

  const addInsight = useInsightStore((s) => s.addInsight);
  const pinCard = useChatStore((s) => s.pinCard);
  const setSidePanelOpen = useAppStore((s) => s.setSidePanelOpen);

  const setAgenticMode = useSimulationStore((s: SimulationState) => s.setAgenticMode);
  const simSetScenarios = useSimulationStore((s: SimulationState) => s.setScenarios);
  const simSetSelectedScenario = useSimulationStore((s: SimulationState) => s.setSelectedScenario);
  const simSetComparisonData = useSimulationStore((s: SimulationState) => s.setComparisonData);
  const simSetIsRunning = useSimulationStore((s: SimulationState) => s.setIsRunning);
  const simAddProgress = useSimulationStore((s: SimulationState) => s.addProgress);
  const simSetAgenticScenarioResults = useSimulationStore((s: SimulationState) => s.setAgenticScenarioResults);

  const connectionRef = useRef<SSEConnection | null>(null);

  const cancel = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    reset();
  }, [reset]);

  const handleQuickAnswer = useCallback(
    (prompt: string) => {
      setPhase("answering");
      // Keep command bar open for inline answer

      connectionRef.current = connectPostSSE(
        copilotApi.quickAnswerUrl(),
        (event) => {
          if (event.type === "text_delta") {
            appendQuickAnswer((event.data.content as string) || "");
          } else if (event.type === "error") {
            setPhase("error");
            setErrorMessage((event.data.message as string) || "Failed to get answer");
          }
        },
        (err) => {
          setPhase("error");
          setErrorMessage(err.message);
        },
        () => {
          setQuickAnswerDone(true);
        },
        {
          prompt,
          dataset_id: activeDataset?.id,
        },
      );
    },
    [activeDataset, setPhase, appendQuickAnswer, setQuickAnswerDone, setErrorMessage],
  );

  const handleGenerateInsight = useCallback(
    (prompt: string, focusArea?: string | null) => {
      setCommandBarOpen(false);
      setPhase("generating");
      setProgressMessage("Analyzing your question...");

      // Start copilot activity feed
      useActivityFeedStore.getState().startFeed("copilot");

      connectionRef.current = connectPostSSE(
        copilotApi.generateInsightUrl(),
        (event) => {
          mapCopilotEvent(event as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState(), "generating");

          if (event.type === "progress") {
            setProgressMessage((event.data.step as string) || "Processing...");
          } else if (event.type === "thinking") {
            setProgressMessage("Claude is thinking...");
          } else if (event.type === "insight") {
            const insight = event.data as unknown as InsightResponse;
            setGeneratedInsight(insight);
            setPhase("result");
          } else if (event.type === "complete") {
            setGeneratedInsightId((event.data.insight_id as string) || null);
          } else if (event.type === "error") {
            setPhase("error");
            setErrorMessage((event.data.message as string) || "Failed to generate insight");
          }
        },
        (err) => {
          setPhase("error");
          setErrorMessage(err.message);
        },
        undefined,
        {
          prompt,
          dataset_id: activeDataset?.id || "",
          ...(focusArea ? { focus_area: focusArea } : {}),
        },
      );
    },
    [
      activeDataset,
      setCommandBarOpen,
      setPhase,
      setProgressMessage,
      setGeneratedInsight,
      setGeneratedInsightId,
      setErrorMessage,
    ],
  );

  const handleRunSimulation = useCallback(
    (prompt: string, focusArea?: string | null) => {
      setCommandBarOpen(false);
      setPhase("generating");
      setProgressMessage("Generating insight for simulation...");

      // Start copilot activity feed
      useActivityFeedStore.getState().startFeed("copilot");

      // Step 1: generate insight first
      connectionRef.current = connectPostSSE(
        copilotApi.generateInsightUrl(),
        (event) => {
          mapCopilotEvent(event as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState(), "generating");

          if (event.type === "progress") {
            setProgressMessage((event.data.step as string) || "Processing...");
          } else if (event.type === "thinking") {
            setProgressMessage("Claude is thinking...");
          } else if (event.type === "insight") {
            const insight = event.data as unknown as InsightResponse;
            setGeneratedInsight(insight);
          } else if (event.type === "complete") {
            const insightId = (event.data.insight_id as string) || null;
            setGeneratedInsightId(insightId);
            if (!insightId) {
              setPhase("error");
              setErrorMessage("No insight generated");
              return;
            }

            // Step 2: trigger agentic simulation
            setPhase("simulating");
            setProgressMessage("Running simulation scenarios...");
            simSetIsRunning(true);

            connectionRef.current = connectPostSSE(
              simulationsApi.triggerAgenticUrl(),
              (simEvent) => {
                mapCopilotEvent(simEvent as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState(), "simulating");

                if (simEvent.type === "progress") {
                  const step = (simEvent.data.step as string) || "";
                  setProgressMessage(step);
                  simAddProgress(step);
                } else if (simEvent.type === "scenario_template") {
                  const scenario = simEvent.data as unknown as {
                    id: string;
                    name: string;
                    template: unknown;
                    nodeParams: unknown;
                  };
                  simSetScenarios(
                    useCopilotStore.getState().phase === "simulating"
                      ? [
                          ...useSimulationStore.getState().scenarios,
                          {
                            id: scenario.id,
                            name: scenario.name,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            template: scenario.template as any,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            nodeParams: scenario.nodeParams as any,
                            results: null,
                          },
                        ]
                      : [],
                  );
                  if (!useSimulationStore.getState().selectedScenario) {
                    simSetSelectedScenario(scenario.id);
                  }
                } else if (simEvent.type === "scenario_result") {
                  const scenarioId = simEvent.data.scenario_id as string;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const results = simEvent.data.results as any;
                  simSetAgenticScenarioResults(scenarioId, results);
                } else if (simEvent.type === "comparison_ready") {
                  simSetComparisonData(simEvent.data);
                } else if (simEvent.type === "error") {
                  setPhase("error");
                  setErrorMessage((simEvent.data.message as string) || "Simulation failed");
                  simSetIsRunning(false);
                }
              },
              (err) => {
                setPhase("error");
                setErrorMessage(err.message);
                simSetIsRunning(false);
              },
              () => {
                simSetIsRunning(false);
                setAgenticMode(true, insightId);
                reset();
                navigate("/simulations");
              },
              { insight_id: insightId },
            );
          } else if (event.type === "error") {
            setPhase("error");
            setErrorMessage((event.data.message as string) || "Failed to generate insight");
          }
        },
        (err) => {
          setPhase("error");
          setErrorMessage(err.message);
        },
        undefined,
        {
          prompt,
          dataset_id: activeDataset?.id || "",
          ...(focusArea ? { focus_area: focusArea } : {}),
        },
      );
    },
    [
      activeDataset,
      setCommandBarOpen,
      setPhase,
      setProgressMessage,
      setGeneratedInsight,
      setGeneratedInsightId,
      setErrorMessage,
      setAgenticMode,
      simSetScenarios,
      simSetSelectedScenario,
      simSetComparisonData,
      simSetIsRunning,
      simAddProgress,
      simSetAgenticScenarioResults,
      navigate,
      reset,
    ],
  );

  const submitPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      reset();
      setUserPrompt(prompt);
      setPhase("classifying");

      try {
        const result = await copilotApi.classify(
          prompt,
          activeDataset?.id,
          location.pathname,
        );
        setClassification(result);

        switch (result.intent) {
          case "navigate": {
            const route = result.route || "/";
            setCommandBarOpen(false);
            reset();
            navigate(route);
            break;
          }
          case "quick_answer":
            handleQuickAnswer(result.refined_prompt || prompt);
            break;
          case "generate_insight":
            if (!activeDataset?.id) {
              setPhase("error");
              setErrorMessage("No active dataset. Please upload or select a dataset first.");
              return;
            }
            handleGenerateInsight(result.refined_prompt || prompt, result.focus_area);
            break;
          case "run_simulation":
            if (!activeDataset?.id) {
              setPhase("error");
              setErrorMessage("No active dataset. Please upload or select a dataset first.");
              return;
            }
            handleRunSimulation(result.refined_prompt || prompt, result.focus_area);
            break;
          default:
            handleQuickAnswer(prompt);
        }
      } catch (err) {
        setPhase("error");
        setErrorMessage(err instanceof Error ? err.message : "Classification failed");
      }
    },
    [
      activeDataset,
      location.pathname,
      reset,
      setUserPrompt,
      setPhase,
      setClassification,
      setCommandBarOpen,
      setErrorMessage,
      handleQuickAnswer,
      handleGenerateInsight,
      handleRunSimulation,
      navigate,
    ],
  );

  const saveToDashboard = useCallback(() => {
    if (generatedInsight) {
      addInsight(generatedInsight);
      reset();
      navigate("/");
    }
  }, [generatedInsight, addInsight, reset, navigate]);

  const pinToChat = useCallback(() => {
    if (generatedInsightId) {
      pinCard(generatedInsightId);
      setSidePanelOpen(true);
      reset();
    }
  }, [generatedInsightId, pinCard, setSidePanelOpen, reset]);

  const triggerSimulation = useCallback(() => {
    if (generatedInsightId && userPrompt) {
      setPhase("simulating");
      setProgressMessage("Running simulation scenarios...");
      handleRunSimulationFromInsight(generatedInsightId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedInsightId, userPrompt]);

  const handleRunSimulationFromInsight = useCallback(
    (insightId: string) => {
      simSetIsRunning(true);

      // Start copilot activity feed for simulation
      useActivityFeedStore.getState().startFeed("copilot");

      connectionRef.current = connectPostSSE(
        simulationsApi.triggerAgenticUrl(),
        (simEvent) => {
          mapCopilotEvent(simEvent as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState(), "simulating");

          if (simEvent.type === "progress") {
            const step = (simEvent.data.step as string) || "";
            setProgressMessage(step);
            simAddProgress(step);
          } else if (simEvent.type === "scenario_template") {
            const scenario = simEvent.data as unknown as {
              id: string;
              name: string;
              template: unknown;
              nodeParams: unknown;
            };
            simSetScenarios([
              ...useSimulationStore.getState().scenarios,
              {
                id: scenario.id,
                name: scenario.name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                template: scenario.template as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nodeParams: scenario.nodeParams as any,
                results: null,
              },
            ]);
            if (!useSimulationStore.getState().selectedScenario) {
              simSetSelectedScenario(scenario.id);
            }
          } else if (simEvent.type === "scenario_result") {
            const scenarioId = simEvent.data.scenario_id as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results = simEvent.data.results as any;
            simSetAgenticScenarioResults(scenarioId, results);
          } else if (simEvent.type === "comparison_ready") {
            simSetComparisonData(simEvent.data);
          } else if (simEvent.type === "error") {
            setPhase("error");
            setErrorMessage((simEvent.data.message as string) || "Simulation failed");
            simSetIsRunning(false);
          }
        },
        (err) => {
          setPhase("error");
          setErrorMessage(err.message);
          simSetIsRunning(false);
        },
        () => {
          simSetIsRunning(false);
          setAgenticMode(true, insightId);
          reset();
          navigate("/simulations");
        },
        { insight_id: insightId },
      );
    },
    [
      setPhase,
      setProgressMessage,
      setErrorMessage,
      setAgenticMode,
      simSetIsRunning,
      simAddProgress,
      simSetScenarios,
      simSetSelectedScenario,
      simSetComparisonData,
      simSetAgenticScenarioResults,
      navigate,
      reset,
    ],
  );

  return {
    // State
    phase,
    userPrompt,
    classification,
    quickAnswerText,
    quickAnswerDone,
    progressMessage,
    generatedInsight,
    generatedInsightId,
    errorMessage,
    // Actions
    submitPrompt,
    cancel,
    reset,
    saveToDashboard,
    pinToChat,
    triggerSimulation,
  };
}
