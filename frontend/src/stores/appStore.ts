import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DatasetResponse } from "@/lib/api";

interface AppState {
  theme: "dark" | "light";
  activeDataset: DatasetResponse | null;
  datasets: DatasetResponse[];
  sidePanelOpen: boolean;
  sidePanelExpanded: boolean;
  commandBarOpen: boolean;

  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setActiveDataset: (dataset: DatasetResponse | null) => void;
  setDatasets: (datasets: DatasetResponse[]) => void;
  addDataset: (dataset: DatasetResponse) => void;
  removeDataset: (id: string) => void;
  toggleSidePanel: () => void;
  setSidePanelOpen: (open: boolean) => void;
  toggleSidePanelExpanded: () => void;
  setSidePanelExpanded: (expanded: boolean) => void;
  setCommandBarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      activeDataset: null,
      datasets: [],
      sidePanelOpen: false,
      sidePanelExpanded: false,
      commandBarOpen: false,

      setTheme: (theme) => {
        document.documentElement.classList.toggle("light", theme === "light");
        set({ theme });
      },

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          document.documentElement.classList.toggle(
            "light",
            newTheme === "light"
          );
          return { theme: newTheme };
        }),

      setActiveDataset: (dataset) => set({ activeDataset: dataset }),
      setDatasets: (datasets) => set({ datasets }),
      addDataset: (dataset) =>
        set((state) => ({ datasets: [dataset, ...state.datasets] })),
      removeDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          activeDataset:
            state.activeDataset?.id === id ? null : state.activeDataset,
        })),

      toggleSidePanel: () =>
        set((state) => ({ sidePanelOpen: !state.sidePanelOpen })),
      setSidePanelOpen: (open) => set({ sidePanelOpen: open }),
      toggleSidePanelExpanded: () =>
        set((state) => ({ sidePanelExpanded: !state.sidePanelExpanded })),
      setSidePanelExpanded: (expanded) =>
        set({ sidePanelExpanded: expanded }),
      setCommandBarOpen: (open) => set({ commandBarOpen: open }),
    }),
    {
      name: "product-insight-autopilot-app",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        theme: s.theme,
        activeDataset: s.activeDataset,
        datasets: s.datasets,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.toggle(
            "light",
            state.theme === "light"
          );
        }
      },
    }
  )
);
