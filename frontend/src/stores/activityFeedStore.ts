import { create } from "zustand";
import type {
  ActivityFlowType,
  ActivityStep,
  ActivitySubTask,
  ActivityFeedState,
} from "@/types/activityFeed";

interface ActivityFeedStore extends ActivityFeedState {
  startFeed: (flowType: ActivityFlowType, flowId?: string) => void;
  completeFeed: () => void;
  resetFeed: () => void;
  addStep: (step: ActivityStep) => void;
  updateStep: (stepId: string, updates: Partial<ActivityStep>) => void;
  completeStep: (stepId: string) => void;
  setStepError: (stepId: string) => void;
  addSubTask: (stepId: string, subTask: ActivitySubTask) => void;
  updateSubTask: (
    stepId: string,
    subTaskId: string,
    updates: Partial<ActivitySubTask>
  ) => void;
  completeSubTask: (
    stepId: string,
    subTaskId: string,
    metricLabel?: string
  ) => void;
  setStepPreview: (
    stepId: string,
    previewType: ActivityStep["previewType"],
    previewData: Record<string, unknown>
  ) => void;
  appendThinking: (stepId: string, text: string) => void;
  setTransitionPhase: (phase: "feed" | "transitioning" | "results") => void;
  setShowFeed: (show: boolean) => void;
}

const INITIAL_STATE: ActivityFeedState = {
  flowType: null,
  flowId: null,
  steps: [],
  isActive: false,
  isComplete: false,
  showFeed: false,
  transitionPhase: "feed",
};

export const useActivityFeedStore = create<ActivityFeedStore>((set) => ({
  ...INITIAL_STATE,

  startFeed: (flowType, flowId) =>
    set({
      flowType,
      flowId: flowId ?? null,
      steps: [],
      isActive: true,
      isComplete: false,
      showFeed: true,
      transitionPhase: "feed",
    }),

  completeFeed: () =>
    set((state) => ({
      isActive: false,
      isComplete: true,
      steps: state.steps.map((s) =>
        s.status === "running" ? { ...s, status: "completed", completedAt: Date.now() } : s
      ),
    })),

  resetFeed: () => set(INITIAL_STATE),

  addStep: (step) =>
    set((state) => ({
      steps: [...state.steps, { ...step, startedAt: step.startedAt ?? Date.now() }],
    })),

  updateStep: (stepId, updates) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    })),

  completeStep: (stepId) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              status: "completed" as const,
              completedAt: Date.now(),
              subTasks: s.subTasks.map((st) =>
                st.status === "running"
                  ? { ...st, status: "completed" as const }
                  : st
              ),
            }
          : s
      ),
    })),

  setStepError: (stepId) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, status: "error" as const } : s
      ),
    })),

  addSubTask: (stepId, subTask) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? { ...s, subTasks: [...s.subTasks, subTask] }
          : s
      ),
    })),

  updateSubTask: (stepId, subTaskId, updates) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              subTasks: s.subTasks.map((st) =>
                st.id === subTaskId ? { ...st, ...updates } : st
              ),
            }
          : s
      ),
    })),

  completeSubTask: (stepId, subTaskId, metricLabel) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              subTasks: s.subTasks.map((st) =>
                st.id === subTaskId
                  ? {
                      ...st,
                      status: "completed" as const,
                      ...(metricLabel !== undefined && { metricLabel }),
                    }
                  : st
              ),
            }
          : s
      ),
    })),

  setStepPreview: (stepId, previewType, previewData) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, previewType, previewData } : s
      ),
    })),

  appendThinking: (stepId, text) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? { ...s, thinkingText: (s.thinkingText ?? "") + text }
          : s
      ),
    })),

  setTransitionPhase: (phase) => set({ transitionPhase: phase }),

  setShowFeed: (show) => set({ showFeed: show }),
}));
