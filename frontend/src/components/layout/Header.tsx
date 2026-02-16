import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  Database,
  Sun,
  Moon,
  Search,
  MessageSquare,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { useSimulationStore } from "@/stores/simulationStore";
import prismLogo from "@/assets/prism-logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/simulations", icon: FlaskConical, label: "Simulations" },
  { to: "/data", icon: Database, label: "Data" },
  { to: "/integrations", icon: Plug, label: "Integrations" },
];

export const Header = () => {
  const { theme, toggleTheme, setCommandBarOpen, toggleSidePanel } =
    useAppStore();
  const location = useLocation();
  const agenticMode = useSimulationStore((s) => s.agenticMode);
  const insightId = useSimulationStore((s) => s.insightId);
  const searchParams = new URLSearchParams(location.search);
  const urlAgentic = searchParams.get("mode") === "agentic";
  const urlInsightId = searchParams.get("insightId");
  // Preserve agentic context from store or URL regardless of current path (e.g. from dashboard)
  const hasAgenticContext =
    (urlAgentic && urlInsightId) || (agenticMode && insightId);
  const effectiveInsightId = urlInsightId ?? insightId ?? "";
  const simulationsTo =
    hasAgenticContext && effectiveInsightId
      ? `/simulations?mode=agentic&insightId=${effectiveInsightId}`
      : "/simulations";

  return (
    <header className="h-12 glass glow-line-bottom flex items-center px-4 gap-2 shrink-0 relative">
      <div className="flex items-center gap-2 mr-6">
        <img
          src={prismLogo}
          alt="Prism"
          className="w-7 h-7 rounded-lg object-cover"
        />
        <span className="font-semibold text-sm tracking-tight">
          Prism
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const href = to === "/simulations" ? simulationsTo : to;
          return (
            <NavLink key={to} to={href}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-xs text-muted-foreground px-3"
        onClick={() => setCommandBarOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Ask AI...</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground tracking-tight">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleSidePanel}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </header>
  );
};
