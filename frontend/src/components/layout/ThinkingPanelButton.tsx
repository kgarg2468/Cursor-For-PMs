import { Brain } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { cn } from "@/lib/utils";

export const ThinkingPanelButton = () => {
  const { thinkingPanelOpen, toggleThinkingPanel } = useAppStore();
  const isActive = useActivityFeedStore((s) => s.isActive);
  const steps = useActivityFeedStore((s) => s.steps);
  const hasThinking = steps.some((s) => s.thinkingText);

  return (
    <button
      onClick={toggleThinkingPanel}
      className={cn(
        "fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full border shadow-md transition-all duration-200",
        "text-sm font-medium",
        thinkingPanelOpen
          ? "bg-primary text-primary-foreground border-primary shadow-primary/20 animate-[glow-pulse_3s_ease-in-out_infinite]"
          : "bg-card/60 backdrop-blur-xl text-foreground border-white/[0.06] hover:border-primary/40 hover:shadow-lg"
      )}
    >
      <div className="relative">
        <Brain
          className={cn(
            "h-4 w-4",
            isActive && !thinkingPanelOpen && "animate-pulse"
          )}
        />
        {isActive && !thinkingPanelOpen && hasThinking && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </div>
      <span className="hidden sm:inline">Thinking</span>
    </button>
  );
};
