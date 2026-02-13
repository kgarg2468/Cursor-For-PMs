import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  /** Dataset id these insights belong to; used to avoid clearing on remount */
  insightsDatasetId: string | null;
  kpis: KPIs | null;
  isGenerating: boolean;
  generationProgress: string[];
  thinkingSteps: string[];
  typeFilter: string | null;
  sortBy: SortBy;

  setInsights: (insights: InsightResponse[], datasetId?: string) => void;
  setInsightsDatasetId: (id: string | null) => void;
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

const insightInitial = {
  insights: [] as InsightResponse[],
  insightsDatasetId: null as string | null,
  kpis: null as KPIs | null,
  isGenerating: false,
  generationProgress: [] as string[],
  thinkingSteps: [] as string[],
  typeFilter: null as string | null,
  sortBy: "impact_score" as SortBy,
};

export const useInsightStore = create<InsightState>()(
  persist(
    (set) => ({
      ...insightInitial,

      setInsights: (insights, datasetId) =>
        set({
          insights,
          ...(datasetId !== undefined && { insightsDatasetId: datasetId }),
        }),
      setInsightsDatasetId: (id) => set({ insightsDatasetId: id }),
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
      clearGenerationProgress: () =>
        set({ generationProgress: [], thinkingSteps: [] }),
      setTypeFilter: (filter) => set({ typeFilter: filter }),
      setSortBy: (sortBy) => set({ sortBy }),
      reset: () =>
        set({
          ...insightInitial,
          isGenerating: false,
          generationProgress: [],
          thinkingSteps: [],
        }),
    }),
    {
      name: "product-insight-autopilot-insights",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        insights: s.insights,
        insightsDatasetId: s.insightsDatasetId,
        kpis: s.kpis,
        typeFilter: s.typeFilter,
        sortBy: s.sortBy,
      }),
    }
  )
);
