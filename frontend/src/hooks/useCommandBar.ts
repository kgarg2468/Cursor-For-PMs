import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";

export function useCommandBar() {
  const setCommandBarOpen = useAppStore((s) => s.setCommandBarOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setCommandBarOpen]);
}
