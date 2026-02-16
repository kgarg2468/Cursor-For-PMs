import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useCopilot } from "@/hooks/useCopilot";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { AgenticActivityFeed } from "@/components/activity/AgenticActivityFeed";
import { CopilotResultCard } from "./CopilotResultCard";

const CopilotActivityContent = ({ cancel }: { cancel: () => void }) => {
  const feedSteps = useActivityFeedStore((s) => s.steps);

  if (feedSteps.length > 0) {
    return (
      <AgenticActivityFeed variant="overlay" flowType="copilot" onCancel={cancel} />
    );
  }

  // Fallback while feed hasn't received events yet
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Processing...</p>
      <button
        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        onClick={cancel}
      >
        Press Esc to cancel
      </button>
    </div>
  );
};

export const CopilotOverlay = () => {
  const {
    phase,
    generatedInsight,
    errorMessage,
    cancel,
    saveToDashboard,
    pinToChat,
    triggerSimulation,
  } = useCopilot();

  const showOverlay =
    phase === "generating" ||
    phase === "simulating" ||
    phase === "result" ||
    (phase === "error" && !errorMessage.includes("No active dataset"));

  const handleBackdropClick = useCallback(() => {
    if (phase === "result" || phase === "error") {
      cancel();
    }
  }, [phase, cancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      }
    },
    [cancel],
  );

  if (!showOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div
        className="relative z-10 w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading state — Activity Feed */}
        {(phase === "generating" || phase === "simulating") && (
          <CopilotActivityContent cancel={cancel} />
        )}

        {/* Result state */}
        {phase === "result" && generatedInsight && (
          <CopilotResultCard
            insight={generatedInsight}
            onRunSimulation={triggerSimulation}
            onPinToChat={pinToChat}
            onSaveToDashboard={saveToDashboard}
            onDismiss={cancel}
          />
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={cancel}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
