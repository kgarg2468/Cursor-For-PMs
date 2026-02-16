import { X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { AgenticActivityFeed } from "@/components/activity/AgenticActivityFeed";

export const ThinkingPanel = () => {
  const { thinkingPanelOpen, setThinkingPanelOpen } = useAppStore();
  const steps = useActivityFeedStore((s) => s.steps);
  const isActive = useActivityFeedStore((s) => s.isActive);

  if (!thinkingPanelOpen) return null;

  return (
    <div className="w-[380px] shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium flex-1">Claude's Reasoning</span>
        {isActive && (
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setThinkingPanelOpen(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {steps.length > 0 ? (
          <AgenticActivityFeed variant="standard" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Brain className="h-5 w-5 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              No reasoning yet
            </p>
            <p className="text-xs text-muted-foreground/60">
              Claude's reasoning will appear here during AI operations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
