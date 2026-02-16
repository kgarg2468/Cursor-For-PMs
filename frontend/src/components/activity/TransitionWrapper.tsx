import { useEffect, useRef, type ReactNode } from "react";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { cn } from "@/lib/utils";

interface TransitionWrapperProps {
  feedContent: ReactNode;
  resultsContent: ReactNode;
}

export const TransitionWrapper = ({
  feedContent,
  resultsContent,
}: TransitionWrapperProps) => {
  const { isComplete, transitionPhase, setTransitionPhase } = useActivityFeedStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isComplete && transitionPhase === "feed") {
      // Pause 500ms then start transition
      timerRef.current = setTimeout(() => {
        setTransitionPhase("transitioning");
        // After transition animation, show results
        timerRef.current = setTimeout(() => {
          setTransitionPhase("results");
        }, 400);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isComplete, transitionPhase, setTransitionPhase]);

  return (
    <div className="relative w-full">
      {/* Feed */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          transitionPhase === "feed" && "opacity-100 translate-y-0",
          transitionPhase === "transitioning" && "opacity-0 -translate-y-4",
          transitionPhase === "results" && "hidden"
        )}
      >
        {feedContent}
      </div>

      {/* Results */}
      <div
        className={cn(
          "transition-all duration-300 ease-in",
          transitionPhase === "feed" && "hidden",
          transitionPhase === "transitioning" && "opacity-0 translate-y-4",
          transitionPhase === "results" && "opacity-100 translate-y-0"
        )}
      >
        {resultsContent}
      </div>
    </div>
  );
};
