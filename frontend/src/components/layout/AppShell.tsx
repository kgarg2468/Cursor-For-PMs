import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SidePanel } from "./SidePanel";
import { CommandBar } from "./CommandBar";
import { useCommandBar } from "@/hooks/useCommandBar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const AppShell = () => {
  useCommandBar();

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <SidePanel />
        </div>
        <CommandBar />
      </div>
    </TooltipProvider>
  );
};
