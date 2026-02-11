import { create } from "zustand";
import type { InsightResponse } from "@/lib/api";

export interface KPIs {
  total_mrr?: number;
  churn_rate?: number;
  churned_count?: number;
  active_accounts?: number;
  avg_nps?: number;
  total_support_tickets?: number;
  total_accounts?: number;
}

export type SortBy = "impact_score" | "created_at" | "impact_revenue";

interface InsightState {
  insights: InsightResponse[];
  kpis: KPIs | null;
  isGenerating: boolean;
  generationProgress: string[];
  thinkingSteps: string[];
  typeFilter: string | null;
  sortBy: SortBy;

  setInsights: (insights: InsightResponse[]) => void;
  addInsight: (insight: InsightResponse) => void;
  dismissInsight: (id: string) => void;
  setKpis: (kpis: KPIs) => void;
  setIsGenerating: (generating: boolean) => void;
  addGenerationProgress: (step: string) => void;
  addThinkingStep: (content: string) => void;
  clearGenerationProgress: () => void;
  setTypeFilter: (filter: string | null) => void;
  setSortBy: (sortBy: SortBy) => void;
  reset: () => void;
}

export const useInsightStore = create<InsightState>((set) => ({
  insights: [],
  kpis: null,
  isGenerating: false,
  generationProgress: [],
  thinkingSteps: [],
  typeFilter: null,
  sortBy: "impact_score",

  setInsights: (insights) => set({ insights }),
  addInsight: (insight) =>
    set((state) => ({ insights: [...state.insights, insight] })),
  dismissInsight: (id) =>
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    })),
  setKpis: (kpis) => set({ kpis }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  addGenerationProgress: (step) =>
    set((state) => ({
      generationProgress: [...state.generationProgress, step],
    })),
  addThinkingStep: (content) =>
    set((state) => ({
      thinkingSteps: [...state.thinkingSteps, content],
    })),
  clearGenerationProgress: () => set({ generationProgress: [], thinkingSteps: [] }),
  setTypeFilter: (filter) => set({ typeFilter: filter }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () => set({ insights: [], kpis: null, isGenerating: false, generationProgress: [], thinkingSteps: [], typeFilter: null, sortBy: "impact_score" }),
}));
