import {
  Check,
  Loader2,
  AlertCircle,
  Search,
  Brain,
  FlaskConical,
  Scale,
  FileText,
  BarChart3,
  Database,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ActivityStep } from "@/types/activityFeed";
import { SubTaskItem } from "./SubTaskItem";
import { StepThinking } from "./StepThinking";
import { StepPreview } from "./StepPreview";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  Brain,
  FlaskConical,
  Scale,
  FileText,
  BarChart3,
  Database,
  Sparkles,
  Zap,
};

interface ActivityStepBlockProps {
  step: ActivityStep;
  compact?: boolean;
}

export const ActivityStepBlock = ({
  step,
  compact = false,
}: ActivityStepBlockProps) => {
  const Icon = ICON_MAP[step.icon] ?? Sparkles;
  const isRunning = step.status === "running";
  const isCompleted = step.status === "completed";
  const isPending = step.status === "pending";
  const isError = step.status === "error";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300",
        isPending && "opacity-40"
      )}
    >
      {/* Icon column */}
      <div className="shrink-0 pt-0.5">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            isRunning && "bg-primary/15 border border-primary/25",
            isCompleted && "bg-emerald-500/10 border border-emerald-500/20",
            isPending && "bg-muted border border-border/50",
            isError && "bg-destructive/10 border border-destructive/20"
          )}
        >
          {isRunning && (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          )}
          {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-500" />}
          {isPending && (
            <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          {isError && (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          )}
        </div>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              "text-sm font-medium",
              isRunning && "text-foreground",
              isCompleted && "text-foreground/70",
              isPending && "text-muted-foreground/50",
              isError && "text-destructive"
            )}
          >
            {step.title}
          </h4>
          {isRunning && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
          )}
          {isCompleted && step.startedAt && step.completedAt && (
            <span className="text-[10px] text-muted-foreground/50">
              {((step.completedAt - step.startedAt) / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {step.subtitle && (
          <p
            className={cn(
              "text-xs mt-0.5",
              isRunning ? "text-muted-foreground" : "text-muted-foreground/60"
            )}
          >
            {step.subtitle}
          </p>
        )}

        {/* Sub-tasks */}
        {!compact && step.subTasks.length > 0 && (
          <div className="mt-2 pl-0.5 space-y-0.5">
            {step.subTasks.map((st) => (
              <SubTaskItem key={st.id} subTask={st} />
            ))}
          </div>
        )}

        {/* Preview */}
        {!compact && step.previewType && step.previewData && (
          <StepPreview
            previewType={step.previewType}
            previewData={step.previewData}
          />
        )}

        {/* Thinking */}
        {step.thinkingText && (
          <StepThinking
            text={step.thinkingText}
            isRunning={isRunning}
          />
        )}
      </div>
    </div>
  );
};
