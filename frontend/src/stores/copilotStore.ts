import { create } from "zustand";
import type { CopilotClassifyResponse, InsightResponse } from "@/lib/api";

export type CopilotPhase =
  | "idle"
  | "classifying"
  | "answering"
  | "generating"
  | "simulating"
  | "result"
  | "error";

interface CopilotState {
  phase: CopilotPhase;
  userPrompt: string;
  classification: CopilotClassifyResponse | null;
  quickAnswerText: string;
  quickAnswerDone: boolean;
  progressMessage: string;
  generatedInsight: InsightResponse | null;
  generatedInsightId: string | null;
  errorMessage: string;

  setPhase: (phase: CopilotPhase) => void;
  setUserPrompt: (prompt: string) => void;
  setClassification: (classification: CopilotClassifyResponse) => void;
  appendQuickAnswer: (text: string) => void;
  setQuickAnswerDone: (done: boolean) => void;
  setProgressMessage: (message: string) => void;
  setGeneratedInsight: (insight: InsightResponse) => void;
  setGeneratedInsightId: (id: string | null) => void;
  setErrorMessage: (message: string) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as CopilotPhase,
  userPrompt: "",
  classification: null as CopilotClassifyResponse | null,
  quickAnswerText: "",
  quickAnswerDone: false,
  progressMessage: "",
  generatedInsight: null as InsightResponse | null,
  generatedInsightId: null as string | null,
  errorMessage: "",
};

export const useCopilotStore = create<CopilotState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setUserPrompt: (prompt) => set({ userPrompt: prompt }),
  setClassification: (classification) => set({ classification }),
  appendQuickAnswer: (text) =>
    set((state) => ({ quickAnswerText: state.quickAnswerText + text })),
  setQuickAnswerDone: (done) => set({ quickAnswerDone: done }),
  setProgressMessage: (message) => set({ progressMessage: message }),
  setGeneratedInsight: (insight) => set({ generatedInsight: insight }),
  setGeneratedInsightId: (id) => set({ generatedInsightId: id }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  reset: () => set({ ...initialState }),
}));
