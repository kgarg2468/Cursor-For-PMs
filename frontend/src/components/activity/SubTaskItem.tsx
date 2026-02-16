import { Check, Loader2, Circle, AlertCircle } from "lucide-react";
import type { ActivitySubTask } from "@/types/activityFeed";
import { cn } from "@/lib/utils";

interface SubTaskItemProps {
  subTask: ActivitySubTask;
}

export const SubTaskItem = ({ subTask }: SubTaskItemProps) => {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {subTask.status === "completed" && (
        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
      )}
      {subTask.status === "running" && (
        <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
      )}
      {subTask.status === "pending" && (
        <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      )}
      {subTask.status === "error" && (
        <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
      )}
      <span
        className={cn(
          "text-xs",
          subTask.status === "completed" && "text-muted-foreground",
          subTask.status === "running" && "text-foreground",
          subTask.status === "pending" && "text-muted-foreground/50",
          subTask.status === "error" && "text-destructive"
        )}
      >
        {subTask.label}
      </span>
      {subTask.metricLabel && (
        <span className="text-[10px] text-primary ml-auto font-medium">
          {subTask.metricLabel}
        </span>
      )}
    </div>
  );
};
