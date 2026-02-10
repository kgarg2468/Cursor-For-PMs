import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FlaskConical,
  Database,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";

export const CommandBar = () => {
  const { commandBarOpen, setCommandBarOpen, setSidePanelOpen } = useAppStore();
  const navigate = useNavigate();

  const runAction = (action: () => void) => {
    setCommandBarOpen(false);
    action();
  };

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={setCommandBarOpen}>
      <CommandInput placeholder="Ask AI anything, or type a command..." />
      <CommandList>
        <CommandEmpty>
          <div className="text-sm text-muted-foreground py-2">
            Press Enter to ask AI this question...
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => navigate("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/simulations"))}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Simulations
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/data"))}>
            <Database className="mr-2 h-4 w-4" />
            Data Sources
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="AI Actions">
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setSidePanelOpen(true);
              })
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate insights from data
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => {
                navigate("/simulations");
              })
            }
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Run a market simulation
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => {
                setSidePanelOpen(true);
              })
            }
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Find anomalies in my data
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
