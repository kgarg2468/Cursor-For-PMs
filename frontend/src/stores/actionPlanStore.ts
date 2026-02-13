import { create } from "zustand";
import type { ActionItemResponse } from "@/lib/api";
import { useAppStore } from "./appStore";

interface ActionPlanState {
  // Wizard state
  selectedInsightId: string | null;
  wizardOpen: boolean;
  wizardStep: 0 | 1 | 2;

  // Wizard action generation
  wizardActions: ActionItemResponse[];
  isGeneratingActions: boolean;
  actionThinkingSteps: string[];

  // Dashboard action plan
  planActions: ActionItemResponse[];

  // Actions
  openWizard: (insightId: string) => void;
  closeWizard: () => void;
  setWizardStep: (step: 0 | 1 | 2) => void;
  setWizardActions: (actions: ActionItemResponse[]) => void;
  addWizardAction: (action: ActionItemResponse) => void;
  setIsGeneratingActions: (generating: boolean) => void;
  addActionThinkingStep: (content: string) => void;
  clearActionGeneration: () => void;
  setPlanActions: (actions: ActionItemResponse[]) => void;
  togglePlanAction: (actionId: string) => void;
}

export const useActionPlanStore = create<ActionPlanState>((set) => ({
  selectedInsightId: null,
  wizardOpen: false,
  wizardStep: 0,
  wizardActions: [],
  isGeneratingActions: false,
  actionThinkingSteps: [],
  planActions: [],

  openWizard: (insightId) => {
    // Close chat side panel when wizard opens
    useAppStore.getState().setSidePanelOpen(false);
    set({
      selectedInsightId: insightId,
      wizardOpen: true,
      wizardStep: 0,
      wizardActions: [],
      isGeneratingActions: false,
      actionThinkingSteps: [],
    });
  },

  closeWizard: () =>
    set({
      wizardOpen: false,
      selectedInsightId: null,
      wizardStep: 0,
      wizardActions: [],
      isGeneratingActions: false,
      actionThinkingSteps: [],
    }),

  setWizardStep: (step) => set({ wizardStep: step }),

  setWizardActions: (actions) => set({ wizardActions: actions }),

  addWizardAction: (action) =>
    set((state) => ({
      wizardActions: [...state.wizardActions, action],
    })),

  setIsGeneratingActions: (generating) =>
    set({ isGeneratingActions: generating }),

  addActionThinkingStep: (content) =>
    set((state) => ({
      actionThinkingSteps: [...state.actionThinkingSteps, content],
    })),

  clearActionGeneration: () =>
    set({ wizardActions: [], isGeneratingActions: false, actionThinkingSteps: [] }),

  setPlanActions: (actions) => set({ planActions: actions }),

  togglePlanAction: (actionId) =>
    set((state) => ({
      planActions: state.planActions.map((a) =>
        a.id === actionId ? { ...a, added_to_plan: !a.added_to_plan } : a
      ),
      wizardActions: state.wizardActions.map((a) =>
        a.id === actionId ? { ...a, added_to_plan: !a.added_to_plan } : a
      ),
    })),
}));
