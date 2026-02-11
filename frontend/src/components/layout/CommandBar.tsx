import { useRef } from "react";
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
import { useChatStore } from "@/stores/chatStore";

export const CommandBar = () => {
  const { commandBarOpen, setCommandBarOpen, setSidePanelOpen } = useAppStore();
  const { setDraftMessage } = useChatStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const openChatWithPrompt = (prompt: string) => {
    setDraftMessage(prompt);
    setSidePanelOpen(true);
  };

  const runAction = (action: () => void) => {
    setCommandBarOpen(false);
    action();
  };

  const handleEmptyClick = () => {
    const value = inputRef.current?.value?.trim();
    if (value) {
      setCommandBarOpen(false);
      openChatWithPrompt(value);
    }
  };

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={setCommandBarOpen}>
      <CommandInput ref={inputRef} placeholder="Ask AI anything, or type a command..." />
      <CommandList>
        <CommandEmpty>
          <button
            className="w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors cursor-pointer"
            onClick={handleEmptyClick}
          >
            Press Enter to ask AI this question...
          </button>
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
                openChatWithPrompt(
                  "Analyze my data and generate key product insights. Focus on the most impactful findings — churn risks, revenue opportunities, and notable trends."
                );
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
                openChatWithPrompt(
                  "Find anomalies and outliers in my product data. Look for unusual patterns, unexpected spikes or drops, and anything that deviates from normal behavior."
                );
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
