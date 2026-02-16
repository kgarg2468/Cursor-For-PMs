import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useInsightStore } from "@/stores/insightStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { mapInsightGenerationEvent } from "@/lib/activityMappers";
import type { KPIs } from "@/stores/insightStore";
import { insightsApi } from "@/lib/api";
import type { InsightResponse } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";

export function useInsights() {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const {
    insights,
    insightsDatasetId,
    kpis,
    isGenerating,
    generationProgress,
    thinkingSteps,
    setInsights,
    setInsightsDatasetId,
    addInsight,
    setKpis,
    setIsGenerating,
    addGenerationProgress,
    addThinkingStep,
    clearGenerationProgress,
    reset,
  } = useInsightStore();

  const connectionRef = useRef<SSEConnection | null>(null);
  const lastDatasetIdRef = useRef<string | null>(null);

  const startGeneration = useCallback(
    (datasetId: string) => {
      // Clean up any existing connection
      if (connectionRef.current) {
        connectionRef.current.close();
      }

      reset();
      setInsightsDatasetId(datasetId);
      setIsGenerating(true);

      // Start activity feed
      useActivityFeedStore.getState().startFeed("insight-generation", datasetId);

      const url = insightsApi.generateUrl(datasetId);
      connectionRef.current = connectPostSSE(
        url,
        (event) => {
          // Activity feed mapper
          mapInsightGenerationEvent(event as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState());

          switch (event.type) {
            case "progress":
              addGenerationProgress(event.data.step as string);
              break;
            case "thinking":
              addThinkingStep(event.data.content as string);
              break;
            case "kpis":
              setKpis(event.data as unknown as KPIs);
              break;
            case "insight":
              addInsight(event.data as unknown as InsightResponse);
              break;
            case "complete":
              setIsGenerating(false);
              connectionRef.current = null;
              break;
            case "error":
              setIsGenerating(false);
              connectionRef.current = null;
              break;
          }
        },
        () => {
          setIsGenerating(false);
          connectionRef.current = null;
        },
        () => {
          setIsGenerating(false);
          connectionRef.current = null;
        }
      );
    },
    [
      reset,
      setInsightsDatasetId,
      setIsGenerating,
      addGenerationProgress,
      addThinkingStep,
      setKpis,
      addInsight,
    ]
  );

  const regenerate = useCallback(() => {
    if (activeDataset) {
      startGeneration(activeDataset.id);
    }
  }, [activeDataset, startGeneration]);

  // When activeDataset changes, check if insights exist, otherwise generate
  useEffect(() => {
    if (!activeDataset) {
      reset();
      lastDatasetIdRef.current = null;
      return;
    }

    // Already have insights for this dataset (e.g. from persistence or same session) — don't overwrite
    if (
      insights.length > 0 &&
      insightsDatasetId === activeDataset.id
    ) {
      lastDatasetIdRef.current = activeDataset.id;
      return;
    }

    // Skip if we already loaded/generated for this dataset this run
    if (lastDatasetIdRef.current === activeDataset.id) return;
    lastDatasetIdRef.current = activeDataset.id;

    // Check for existing insights from API
    (async () => {
      try {
        const existing = await insightsApi.list(activeDataset.id);
        if (existing.length > 0) {
          setInsights(existing, activeDataset.id);
          try {
            const kpisData = await insightsApi.kpis(activeDataset.id);
            setKpis(kpisData as unknown as KPIs);
          } catch {
            // KPIs are optional
          }
        } else {
          startGeneration(activeDataset.id);
        }
      } catch {
        // If listing fails and we have no in-memory insights for this dataset, try generating
        if (insightsDatasetId !== activeDataset.id) {
          startGeneration(activeDataset.id);
        }
      }
    })();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
  }, [
    activeDataset,
    insights.length,
    insightsDatasetId,
    reset,
    setInsights,
    setKpis,
    startGeneration,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  return {
    insights,
    kpis,
    isGenerating,
    generationProgress,
    thinkingSteps,
    regenerate,
    clearGenerationProgress,
  };
}
