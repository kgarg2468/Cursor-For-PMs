import { useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import type { ActivityFlowType } from "@/types/activityFeed";
import { ActivityStepBlock } from "./ActivityStepBlock";
import { cn } from "@/lib/utils";

interface AgenticActivityFeedProps {
  variant?: "standard" | "compact" | "overlay";
  flowType?: ActivityFlowType;
  title?: string;
  onCancel?: () => void;
}

const FLOW_TITLES: Record<ActivityFlowType, string> = {
  "agentic-simulation": "Running Strategic Simulation",
  simulation: "Running Simulation",
  "insight-generation": "Generating Insights",
  copilot: "Processing Request",
  chat: "Thinking",
};

export const AgenticActivityFeed = ({
  variant = "standard",
  flowType,
  title,
  onCancel,
}: AgenticActivityFeedProps) => {
  const { steps, isActive, flowType: storeFlowType } = useActivityFeedStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayFlowType = flowType ?? storeFlowType;
  const displayTitle = title ?? (displayFlowType ? FLOW_TITLES[displayFlowType] : "Processing");

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  if (steps.length === 0 && isActive) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          variant === "standard" && "py-16",
          variant === "compact" && "py-4",
          variant === "overlay" && "py-12"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            {displayTitle}...
          </p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    // Show only the latest running step
    const latestStep = [...steps].reverse().find((s) => s.status === "running") ?? steps[steps.length - 1];
    if (!latestStep) return null;

    return (
      <div className="px-3 py-2">
        <ActivityStepBlock step={latestStep} compact />
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-xl border border-border bg-card shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">{displayTitle}</h3>
            {onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCancel}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto" ref={scrollRef}>
            {steps.map((step) => (
              <ActivityStepBlock key={step.id} step={step} />
            ))}
          </div>
          {onCancel && (
            <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
              Press Esc to cancel
            </p>
          )}
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
          <h3 className="text-sm font-medium text-foreground">{displayTitle}</h3>
        </div>
        {onCancel && isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="space-y-1 max-h-[60vh] overflow-y-auto pr-1"
      >
        {steps.map((step) => (
          <ActivityStepBlock key={step.id} step={step} />
        ))}
      </div>

      {/* Loading bar */}
      {isActive && (
        <div className="mt-4 h-0.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full animate-pulse w-2/3" />
        </div>
      )}
    </div>
  );
};
