import { useCallback, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useSimulationStore } from "@/stores/simulationStore";
import { simulationsApi } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";
import type {
  FanChartData,
  TornadoChartData,
  HistogramData,
  ScenarioTableData,
  VaRCardData,
} from "@/types/simulation";

export function useSimulation() {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const {
    selectedTemplate,
    nodeParams,
    nodeContext,
    getNodeContextScope,
    isRunning,
    progress,
    thinkingSteps,
    fanChart,
    tornadoChart,
    histogram,
    scenarioTable,
    varCard,
    summary,
    setIsRunning,
    addProgress,
    addThinkingStep,
    setFanChart,
    setTornadoChart,
    setHistogram,
    setScenarioTable,
    setVarCard,
    setSummary,
    setSimulationId,
    clearResults,
    setActiveTab,
  } = useSimulationStore();

  const connectionRef = useRef<SSEConnection | null>(null);

  const runSimulation = useCallback(() => {
    if (!selectedTemplate) return;

    // Close existing connection
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    clearResults();
    setIsRunning(true);
    setActiveTab("results");

    const scope = getNodeContextScope();
    const node_context: Record<string, { user_message: string; claude_reply?: string }> = {};
    for (const node of selectedTemplate.nodes) {
      const key = `${scope}:${node.id}`;
      const ctx = nodeContext[key];
      if (ctx?.userMessage) {
        node_context[node.id] = {
          user_message: ctx.userMessage,
          ...(ctx.claudeReply && { claude_reply: ctx.claudeReply }),
        };
      }
    }

    const url = simulationsApi.runGraphUrl();
    const body = {
      template_id: selectedTemplate.id,
      template_name: selectedTemplate.name,
      node_params: nodeParams,
      node_structure: selectedTemplate.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: {
          label: n.data.label,
          subtitle: n.data.subtitle,
        },
      })),
      edge_structure: selectedTemplate.edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
      dataset_id: activeDataset?.id ?? null,
      ...(Object.keys(node_context).length > 0 && { node_context }),
    };

    connectionRef.current = connectPostSSE(
      url,
      (event) => {
        switch (event.type) {
          case "progress":
            addProgress(event.data.step as string);
            break;
          case "thinking":
            addThinkingStep(event.data.content as string);
            break;
          case "fan_chart":
            setFanChart(event.data as unknown as FanChartData);
            break;
          case "tornado_chart":
            setTornadoChart(event.data as unknown as TornadoChartData);
            break;
          case "histogram":
            setHistogram(event.data as unknown as HistogramData);
            break;
          case "scenario_table":
            setScenarioTable(event.data as unknown as ScenarioTableData);
            break;
          case "var_card":
            setVarCard(event.data as unknown as VaRCardData);
            break;
          case "summary":
            setSummary(event.data as unknown as string);
            break;
          case "complete":
            setIsRunning(false);
            setSimulationId((event.data.simulation_id as string) || "");
            connectionRef.current = null;
            break;
          case "error":
            setIsRunning(false);
            connectionRef.current = null;
            break;
        }
      },
      () => {
        setIsRunning(false);
        connectionRef.current = null;
      },
      () => {
        setIsRunning(false);
        connectionRef.current = null;
      },
      body,
    );
  }, [
    selectedTemplate,
    nodeParams,
    nodeContext,
    getNodeContextScope,
    activeDataset,
    clearResults,
    setIsRunning,
    setActiveTab,
    addProgress,
    addThinkingStep,
    setFanChart,
    setTornadoChart,
    setHistogram,
    setScenarioTable,
    setVarCard,
    setSummary,
    setSimulationId,
  ]);

  const stopSimulation = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsRunning(false);
  }, [setIsRunning]);

  return {
    isRunning,
    progress,
    thinkingSteps,
    fanChart,
    tornadoChart,
    histogram,
    scenarioTable,
    varCard,
    summary,
    runSimulation,
    stopSimulation,
  };
}
