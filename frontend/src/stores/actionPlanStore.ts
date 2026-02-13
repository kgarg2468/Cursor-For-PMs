import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  /** Add multiple actions to the plan (e.g. "Add All"). Updates both planActions and wizardActions flags. */
  addActionsToPlan: (actions: ActionItemResponse[]) => void;
  togglePlanAction: (actionId: string) => void;
}

export const useActionPlanStore = create<ActionPlanState>()(
  persist(
    (set) => ({
      selectedInsightId: null,
      wizardOpen: false,
      wizardStep: 0,
      wizardActions: [],
      isGeneratingActions: false,
      actionThinkingSteps: [],
      planActions: [],

      openWizard: (insightId) => {
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
        set({
          wizardActions: [],
          isGeneratingActions: false,
          actionThinkingSteps: [],
        }),

      setPlanActions: (actions) => set({ planActions: actions }),

      addActionsToPlan: (actions) =>
        set((state) => {
          const toAdd = actions.filter(
            (a) => !state.planActions.some((p) => p.id === a.id)
          );
          const withAdded = toAdd.map((a) => ({ ...a, added_to_plan: true }));
          const updatedPlanActions = [...state.planActions, ...withAdded];
          const updatedWizardActions = state.wizardActions.map((w) =>
            toAdd.some((a) => a.id === w.id)
              ? { ...w, added_to_plan: true }
              : w
          );
          return {
            planActions: updatedPlanActions,
            wizardActions: updatedWizardActions,
          };
        }),

      togglePlanAction: (actionId) =>
        set((state) => {
          // Find the action in wizardActions to get full data
          const wizardAction = state.wizardActions.find((a) => a.id === actionId);
          const currentPlanAction = state.planActions.find((a) => a.id === actionId);
          
          // Determine new added_to_plan state
          const newAddedToPlan = wizardAction
            ? !wizardAction.added_to_plan
            : currentPlanAction
            ? !currentPlanAction.added_to_plan
            : true;

          // Update wizardActions
          const updatedWizardActions = state.wizardActions.map((a) =>
            a.id === actionId ? { ...a, added_to_plan: newAddedToPlan } : a
          );

          // Update planActions: add if adding, remove if removing, update if exists
          let updatedPlanActions: ActionItemResponse[];
          if (newAddedToPlan) {
            // Adding: ensure it's in planActions
            if (currentPlanAction) {
              // Update existing
              updatedPlanActions = state.planActions.map((a) =>
                a.id === actionId ? { ...a, added_to_plan: true } : a
              );
            } else if (wizardAction) {
              // Add new from wizardActions
              updatedPlanActions = [
                ...state.planActions,
                { ...wizardAction, added_to_plan: true },
              ];
            } else {
              // Fallback: update existing if found
              updatedPlanActions = state.planActions.map((a) =>
                a.id === actionId ? { ...a, added_to_plan: true } : a
              );
            }
          } else {
            // Removing: filter out from planActions
            updatedPlanActions = state.planActions.filter((a) => a.id !== actionId);
          }

          return {
            planActions: updatedPlanActions,
            wizardActions: updatedWizardActions,
          };
        }),
    }),
    {
      name: "product-insight-autopilot-action-plan",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ planActions: s.planActions }),
    }
  )
);
