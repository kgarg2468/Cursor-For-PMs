import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { ActivityStepBlock } from "./ActivityStepBlock";

interface ActivityLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FLOW_LABELS: Record<string, string> = {
  "agentic-simulation": "Strategic Simulation",
  simulation: "Simulation",
  "insight-generation": "Insight Generation",
  copilot: "Copilot",
  chat: "Chat",
};

export const ActivityLogDrawer = ({
  open,
  onOpenChange,
}: ActivityLogDrawerProps) => {
  const { steps, flowType } = useActivityFeedStore();

  const title = flowType ? FLOW_LABELS[flowType] ?? "Activity" : "Activity";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[460px]">
        <SheetHeader>
          <SheetTitle className="text-sm">{title} Log</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity recorded yet.
            </p>
          ) : (
            steps.map((step) => (
              <ActivityStepBlock key={step.id} step={step} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
