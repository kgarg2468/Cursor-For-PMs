import { create } from "zustand";
import type {
  SimTemplate,
  NodeParamValues,
  FanChartData,
  TornadoChartData,
  HistogramData,
  ScenarioTableData,
  VaRCardData,
  SimulationResults,
} from "@/types/simulation";

type SimTab = "graph" | "results";

/** One agentic scenario as template + params + results (for graph + NodeInspector + results). */
export interface AgenticScenarioItem {
  id: string;
  name: string;
  template: SimTemplate;
  nodeParams: NodeParamValues;
  results: SimulationResults | null;
}

interface SimulationState {
  selectedTemplate: SimTemplate | null;
  nodeParams: NodeParamValues;
  activeTab: SimTab;
  isRunning: boolean;
  progress: string[];
  thinkingSteps: string[];
  simulationId: string | null;
  inspectedNodeId: string | null;

  fanChart: FanChartData | null;
  tornadoChart: TornadoChartData | null;
  histogram: HistogramData | null;
  scenarioTable: ScenarioTableData | null;
  varCard: VaRCardData | null;
  summary: string | null;

  // Agentic simulation state (template-like scenarios + per-scenario params/results)
  agenticMode: boolean;
  insightId: string | null;
  scenarios: AgenticScenarioItem[];
  selectedScenario: string | null;
  comparisonData: unknown | null;
  artifacts: Array<{ type: string; content: string; title: string; metadata?: unknown }>;

  selectTemplate: (template: SimTemplate) => void;
  setNodeParam: (nodeId: string, paramKey: string, value: number) => void;
  setActiveTab: (tab: SimTab) => void;
  setIsRunning: (running: boolean) => void;
  addProgress: (step: string) => void;
  addThinkingStep: (content: string) => void;
  setSimulationId: (id: string) => void;
  setInspectedNodeId: (id: string | null) => void;

  setFanChart: (data: FanChartData) => void;
  setTornadoChart: (data: TornadoChartData) => void;
  setHistogram: (data: HistogramData) => void;
  setScenarioTable: (data: ScenarioTableData) => void;
  setVarCard: (data: VaRCardData) => void;
  setSummary: (text: string) => void;

  clearResults: () => void;
  reset: () => void;

  // Agentic simulation actions
  setAgenticMode: (mode: boolean, insightId?: string) => void;
  setScenarios: (scenarios: AgenticScenarioItem[]) => void;
  setSelectedScenario: (scenarioId: string | null) => void;
  setComparisonData: (data: unknown) => void;
  setArtifacts: (artifacts: Array<{ type: string; content: string; title: string; metadata?: unknown }>) => void;
  /** Update results for one scenario; if it's the selected one, also set top-level fanChart/etc. */
  setAgenticScenarioResults: (scenarioId: string, results: SimulationResults) => void;
  /** Sync selected scenario's template/params/results to selectedTemplate, nodeParams, fanChart/etc. */
  syncSelectedScenarioToTemplate: () => void;
}

const EMPTY_RESULTS = {
  fanChart: null,
  tornadoChart: null,
  histogram: null,
  scenarioTable: null,
  varCard: null,
  summary: null,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedTemplate: null,
  nodeParams: {},
  activeTab: "graph",
  isRunning: false,
  progress: [],
  thinkingSteps: [],
  simulationId: null,
  inspectedNodeId: null,
  ...EMPTY_RESULTS,
  agenticMode: false,
  insightId: null,
  scenarios: [],
  selectedScenario: null,
  comparisonData: null,
  artifacts: [],

  selectTemplate: (template) => {
    const params: NodeParamValues = {};
    for (const node of template.nodes) {
      const nodeData = node.data;
      if (nodeData.params.length > 0) {
        params[node.id] = {};
        for (const p of nodeData.params) {
          params[node.id][p.key] = p.default;
        }
      }
    }
    set({
      selectedTemplate: template,
      nodeParams: params,
      activeTab: "graph",
      inspectedNodeId: null,
      ...EMPTY_RESULTS,
      progress: [],
      thinkingSteps: [],
      simulationId: null,
      isRunning: false,
    });
  },

  setNodeParam: (nodeId, paramKey, value) =>
    set((state) => {
      const nextNodeParams = {
        ...state.nodeParams,
        [nodeId]: {
          ...state.nodeParams[nodeId],
          [paramKey]: value,
        },
      };
      // In agentic mode, persist to current scenario's nodeParams
      if (state.agenticMode && state.selectedScenario && state.scenarios.length > 0) {
        const scenarios = state.scenarios.map((s) =>
          s.id === state.selectedScenario
            ? { ...s, nodeParams: nextNodeParams }
            : s
        );
        return { nodeParams: nextNodeParams, scenarios };
      }
      return { nodeParams: nextNodeParams };
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsRunning: (running) => set({ isRunning: running }),
  addProgress: (step) =>
    set((state) => ({ progress: [...state.progress, step] })),
  addThinkingStep: (content) =>
    set((state) => ({ thinkingSteps: [...state.thinkingSteps, content] })),
  setSimulationId: (id) => set({ simulationId: id }),
  setInspectedNodeId: (id) => set({ inspectedNodeId: id }),

  setFanChart: (data) => set({ fanChart: data }),
  setTornadoChart: (data) => set({ tornadoChart: data }),
  setHistogram: (data) => set({ histogram: data }),
  setScenarioTable: (data) => set({ scenarioTable: data }),
  setVarCard: (data) => set({ varCard: data }),
  setSummary: (text) => set({ summary: text }),

  clearResults: () =>
    set({
      ...EMPTY_RESULTS,
      progress: [],
      thinkingSteps: [],
      simulationId: null,
      isRunning: false,
    }),

  reset: () =>
    set({
      selectedTemplate: null,
      nodeParams: {},
      activeTab: "graph",
      isRunning: false,
      progress: [],
      thinkingSteps: [],
      simulationId: null,
      inspectedNodeId: null,
      ...EMPTY_RESULTS,
      agenticMode: false,
      insightId: null,
      scenarios: [],
      selectedScenario: null,
      comparisonData: null,
      artifacts: [],
    }),

  setAgenticMode: (mode, insightId) =>
    set({
      agenticMode: mode,
      insightId: insightId || null,
      activeTab: "graph",
    }),

  setScenarios: (scenarios) => set({ scenarios }),

  setSelectedScenario: (scenarioId) =>
    set((state) => {
      const next: Partial<SimulationState> = { selectedScenario: scenarioId };
      if (!state.agenticMode || !scenarioId || state.scenarios.length === 0)
        return next;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        next.selectedTemplate = scenario.template;
        next.nodeParams = scenario.nodeParams;
        next.activeTab = "graph";
        next.inspectedNodeId = null;
        if (scenario.results) {
          next.fanChart = scenario.results.fanChart;
          next.tornadoChart = scenario.results.tornadoChart;
          next.histogram = scenario.results.histogram;
          next.scenarioTable = scenario.results.scenarioTable;
          next.varCard = scenario.results.varCard;
          next.summary = scenario.results.summary;
        } else {
          next.fanChart = null;
          next.tornadoChart = null;
          next.histogram = null;
          next.scenarioTable = null;
          next.varCard = null;
          next.summary = null;
        }
      }
      return next;
    }),

  setComparisonData: (data) => set({ comparisonData: data }),
  setArtifacts: (artifacts) => set({ artifacts }),

  setAgenticScenarioResults: (scenarioId, results) =>
    set((state) => {
      const scenarios = state.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, results } : s
      );
      const next: Partial<SimulationState> = { scenarios };
      if (state.selectedScenario === scenarioId) {
        next.fanChart = results.fanChart;
        next.tornadoChart = results.tornadoChart;
        next.histogram = results.histogram;
        next.scenarioTable = results.scenarioTable;
        next.varCard = results.varCard;
        next.summary = results.summary;
      }
      return next;
    }),

  syncSelectedScenarioToTemplate: () =>
    set((state) => {
      if (!state.agenticMode || !state.selectedScenario || state.scenarios.length === 0)
        return {};
      const scenario = state.scenarios.find((s) => s.id === state.selectedScenario);
      if (!scenario) return {};
      return {
        selectedTemplate: scenario.template,
        nodeParams: scenario.nodeParams,
        fanChart: scenario.results?.fanChart ?? null,
        tornadoChart: scenario.results?.tornadoChart ?? null,
        histogram: scenario.results?.histogram ?? null,
        scenarioTable: scenario.results?.scenarioTable ?? null,
        varCard: scenario.results?.varCard ?? null,
        summary: scenario.results?.summary ?? null,
      };
    }),
}));
