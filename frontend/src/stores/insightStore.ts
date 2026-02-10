import { create } from "zustand";
import type { InsightResponse } from "@/lib/api";

interface InsightState {
  insights: InsightResponse[];
  isGenerating: boolean;
  generationProgress: string[];

  setInsights: (insights: InsightResponse[]) => void;
  addInsight: (insight: InsightResponse) => void;
  dismissInsight: (id: string) => void;
  setIsGenerating: (generating: boolean) => void;
  addGenerationProgress: (step: string) => void;
  clearGenerationProgress: () => void;
}

export const useInsightStore = create<InsightState>((set) => ({
  insights: [],
  isGenerating: false,
  generationProgress: [],

  setInsights: (insights) => set({ insights }),
  addInsight: (insight) =>
    set((state) => ({ insights: [insight, ...state.insights] })),
  dismissInsight: (id) =>
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    })),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  addGenerationProgress: (step) =>
    set((state) => ({
      generationProgress: [...state.generationProgress, step],
    })),
  clearGenerationProgress: () => set({ generationProgress: [] }),
}));
