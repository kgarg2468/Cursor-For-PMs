import { create } from "zustand";
import type {
  SimTemplate,
  NodeParamValues,
  FanChartData,
  TornadoChartData,
  HistogramData,
  ScenarioTableData,
  VaRCardData,
} from "@/types/simulation";

type SimTab = "graph" | "results";

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
    set((state) => ({
      nodeParams: {
        ...state.nodeParams,
        [nodeId]: {
          ...state.nodeParams[nodeId],
          [paramKey]: value,
        },
      },
    })),

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
    }),
}));
