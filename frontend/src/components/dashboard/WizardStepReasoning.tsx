import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Loader2, Brain } from "lucide-react";
import type { InsightResponse } from "@/lib/api";
import { insightsApi } from "@/lib/api";

interface WizardStepReasoningProps {
  insight: InsightResponse;
  onNext: () => void;
}

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold mt-2 mb-1 text-foreground">
          {line.slice(2, -2)}
        </h4>
      );
    } else if (line.match(/^\*\*[^*]+:\*\*/)) {
      const boldEnd = line.indexOf(":**") + 3;
      const boldText = line.slice(2, boldEnd - 3);
      const rest = line.slice(boldEnd);
      elements.push(
        <p key={i} className="text-xs text-muted-foreground leading-relaxed mt-2">
          <span className="font-semibold text-foreground">{boldText}:</span>
          {rest}
        </p>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={i} className="text-xs text-muted-foreground ml-4 list-disc leading-relaxed">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    }
  }
  return elements;
};

export const WizardStepReasoning = ({
  insight,
  onNext,
}: WizardStepReasoningProps) => {
  const [reasoning, setReasoning] = useState<string | null>(
    insight.ai_reasoning ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [didAttemptLoad, setDidAttemptLoad] = useState(false);

  // If no reasoning available, trigger lazy-load on first render
  if (!reasoning && !isLoading && !didAttemptLoad) {
    setDidAttemptLoad(true);
    setIsLoading(true);
    insightsApi
      .expand(insight.id)
      .then((result) => setReasoning(result.ai_reasoning))
      .catch(() => setReasoning("Failed to load detailed analysis. Please try again."))
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            AI Reasoning
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating detailed analysis...
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : reasoning ? (
          <div>{renderMarkdown(reasoning)}</div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button onClick={onNext} className="w-full gap-2">
          Next: Generate Actions
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
