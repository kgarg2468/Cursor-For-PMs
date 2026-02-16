import { useRef, useCallback } from "react";
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
  Loader2,
  Pin,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { useCopilot } from "@/hooks/useCopilot";

const CopilotInlineAnswer = ({
  text,
  done,
  onPinToChat,
  onFollowUp,
}: {
  text: string;
  done: boolean;
  onPinToChat: () => void;
  onFollowUp: () => void;
}) => {
  return (
    <div className="px-4 py-3">
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {text}
        {!done && <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />}
      </p>
      {done && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
          <button
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-accent rounded-md px-2.5 py-1.5 transition-colors"
            onClick={onPinToChat}
          >
            <Pin className="h-3 w-3" />
            Pin to Chat
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-accent rounded-md px-2.5 py-1.5 transition-colors"
            onClick={onFollowUp}
          >
            <MessageSquare className="h-3 w-3" />
            Ask follow-up
          </button>
        </div>
      )}
    </div>
  );
};

export const CommandBar = () => {
  const { commandBarOpen, setCommandBarOpen } = useAppStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    phase,
    quickAnswerText,
    quickAnswerDone,
    errorMessage,
    submitPrompt,
    cancel,
    pinToChat,
  } = useCopilot();

  const isProcessing = phase === "classifying" || phase === "answering";

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isProcessing) {
        cancel();
      }
      setCommandBarOpen(open);
    },
    [isProcessing, cancel, setCommandBarOpen],
  );

  const runAction = (action: () => void) => {
    setCommandBarOpen(false);
    action();
  };

  const handleSubmit = useCallback(() => {
    const value = inputRef.current?.value?.trim();
    if (value && phase === "idle") {
      submitPrompt(value);
    }
  }, [phase, submitPrompt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        // Only intercept Enter when no cmdk item is highlighted
        // cmdk will handle Enter for selected items via onSelect
        const selected = document.querySelector("[cmdk-item][data-selected=true]");
        if (!selected) {
          e.preventDefault();
          handleSubmit();
        }
      }
    },
    [handleSubmit],
  );

  return (
    <CommandDialog
      open={commandBarOpen}
      onOpenChange={handleOpenChange}
    >
      <div onKeyDown={handleKeyDown}>
        <CommandInput
          ref={inputRef}
          className="font-mono"
          placeholder={
            phase === "classifying"
              ? "Understanding your request..."
              : "Ask AI anything, or type a command..."
          }
          disabled={isProcessing}
        />
      </div>

      {/* Classifying spinner */}
      {phase === "classifying" && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Understanding your request...
        </div>
      )}

      {/* Inline quick answer */}
      {phase === "answering" && (
        <CopilotInlineAnswer
          text={quickAnswerText}
          done={quickAnswerDone}
          onPinToChat={() => {
            pinToChat();
            setCommandBarOpen(false);
          }}
          onFollowUp={() => {
            cancel();
            // Reset input so user can type a follow-up
          }}
        />
      )}

      {/* Error in modal */}
      {phase === "error" && errorMessage && (
        <div className="px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Normal command list — only show when idle */}
      {phase === "idle" && (
        <CommandList>
          <CommandEmpty>
            <button
              className="w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors cursor-pointer"
              onClick={handleSubmit}
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
              onSelect={() => {
                if (inputRef.current) inputRef.current.value = "";
                submitPrompt(
                  "Analyze my data and generate key product insights. Focus on the most impactful findings."
                );
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate insights from data
            </CommandItem>
            <CommandItem
              onSelect={() => {
                if (inputRef.current) inputRef.current.value = "";
                submitPrompt(
                  "Simulate the impact of pricing and feature changes on our key metrics."
                );
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Run a market simulation
            </CommandItem>
            <CommandItem
              onSelect={() => {
                if (inputRef.current) inputRef.current.value = "";
                submitPrompt(
                  "Find anomalies and outliers in my product data."
                );
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Find anomalies in my data
            </CommandItem>
          </CommandGroup>
        </CommandList>
      )}
    </CommandDialog>
  );
};
