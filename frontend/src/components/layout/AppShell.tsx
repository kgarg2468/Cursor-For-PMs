import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SidePanel } from "./SidePanel";
import { ThinkingPanel } from "./ThinkingPanel";
import { ThinkingPanelButton } from "./ThinkingPanelButton";
import { CommandBar } from "./CommandBar";
import { useCommandBar } from "@/hooks/useCommandBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InsightWizardPanel } from "@/components/dashboard/InsightWizardPanel";
import { CopilotOverlay } from "@/components/copilot/CopilotOverlay";

export const AppShell = () => {
  useCommandBar();

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden relative">
          <ThinkingPanel />
          <main className="flex-1 overflow-auto dot-grid">
            <Outlet />
          </main>
          <SidePanel />
          <InsightWizardPanel />
        </div>
        <CommandBar />
        <CopilotOverlay />
        <ThinkingPanelButton />
      </div>
    </TooltipProvider>
  );
};
