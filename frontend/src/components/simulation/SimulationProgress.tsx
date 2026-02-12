import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationProgressProps {
  progress: string[];
  thinkingSteps: string[];
}

export const SimulationProgress = ({
  progress,
  thinkingSteps,
}: SimulationProgressProps) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm">Running Simulation...</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claude is reasoning through the causal chain
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {progress.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === progress.length - 1
                    ? "bg-primary animate-pulse"
                    : "bg-muted-foreground/50",
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  i === progress.length - 1
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {thinkingSteps.length > 0 && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground px-2"
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
            >
              <Brain className="h-3 w-3" />
              AI Reasoning
              {thinkingExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            {thinkingExpanded && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-3">
                {thinkingSteps.map((step, i) => (
                  <p
                    key={i}
                    className="text-[11px] text-muted-foreground leading-relaxed"
                  >
                    {step}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse w-2/3 transition-all duration-1000" />
        </div>
      </CardContent>
    </Card>
  );
};
