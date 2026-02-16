import { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import type { ActivityFlowType } from "@/types/activityFeed";
import { AgenticActivityFeed } from "./AgenticActivityFeed";
import { cn } from "@/lib/utils";

interface CollapsibleReasoningFeedProps {
  flowType?: ActivityFlowType;
}

export const CollapsibleReasoningFeed = ({
  flowType,
}: CollapsibleReasoningFeedProps) => {
  const steps = useActivityFeedStore((s) => s.steps);
  const isActive = useActivityFeedStore((s) => s.isActive);
  const isComplete = useActivityFeedStore((s) => s.isComplete);
  const [collapsed, setCollapsed] = useState(false);

  // While active, render the feed as-is
  if (isActive) {
    return <AgenticActivityFeed variant="standard" flowType={flowType} />;
  }

  // After completion, show a collapsible card
  if (isComplete && steps.length > 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <button
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground flex-1">
            Claude's reasoning ({steps.length} step{steps.length !== 1 ? "s" : ""})
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              collapsed && "-rotate-90"
            )}
          />
        </button>
        {!collapsed && (
          <div className="px-4 pb-4 border-t border-border/50">
            <div className="pt-3">
              <AgenticActivityFeed variant="standard" flowType={flowType} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // No steps and not active — render nothing
  return null;
};
