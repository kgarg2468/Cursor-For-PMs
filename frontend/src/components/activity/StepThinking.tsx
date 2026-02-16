import { useState, useCallback, useEffect } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepThinkingProps {
  text: string;
  isRunning: boolean;
}

export const StepThinking = ({ text, isRunning }: StepThinkingProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-expand when running
  useEffect(() => {
    if (isRunning) {
      setExpanded(true);
    }
  }, [isRunning]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [text]
  );

  if (!text) return null;

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="mt-2">
      <button
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {isRunning ? (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              !expanded && "-rotate-90"
            )}
          />
        )}
        {isRunning ? "Reasoning..." : "View reasoning"}
        {!isRunning && (
          <span className="text-muted-foreground/50 ml-1">
            ({wordCount} words)
          </span>
        )}
      </button>
      {expanded && (
        <div className="relative mt-1 group/thinking">
          <div className="text-[10px] text-muted-foreground/80 bg-muted/30 rounded px-2 py-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap border border-border/30">
            {text}
          </div>
          {!isRunning && (
            <button
              onClick={handleCopy}
              className="absolute top-1.5 right-1.5 opacity-0 group-hover/thinking:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded bg-muted/80"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
