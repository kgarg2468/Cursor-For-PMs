import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ActionItemResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  action: ActionItemResponse;
  onTogglePlan?: (actionId: string) => void;
  showInsightLink?: boolean;
  onInsightClick?: (insightId: string) => void;
}

const priorityConfig = {
  high: { border: "border-l-red-500", label: "High", badge: "bg-red-500/15 text-red-500 border-red-500/30" },
  medium: { border: "border-l-amber-500", label: "Medium", badge: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  low: { border: "border-l-blue-500", label: "Low", badge: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
};

const effortLabels: Record<string, string> = {
  quick_win: "Quick Win",
  moderate: "Moderate",
  major: "Major",
};

const categoryLabels: Record<string, string> = {
  product: "Product",
  growth: "Growth",
  engineering: "Engineering",
  support: "Support",
  pricing: "Pricing",
  marketing: "Marketing",
};

export const ActionCard = ({
  action,
  onTogglePlan,
  showInsightLink,
  onInsightClick,
}: ActionCardProps) => {
  const config = priorityConfig[action.priority] || priorityConfig.medium;

  return (
    <div
      className={cn(
        "border border-border rounded-lg p-3 border-l-4 bg-card",
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        {onTogglePlan && (
          <Checkbox
            checked={action.added_to_plan}
            onCheckedChange={() => onTogglePlan(action.id)}
            className="mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{action.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {action.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge className={cn("text-[10px] px-1.5 py-0", config.badge)}>
              {config.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {effortLabels[action.effort] || action.effort}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {categoryLabels[action.category] || action.category}
            </Badge>
          </div>
          {showInsightLink && onInsightClick && (
            <button
              onClick={() => onInsightClick(action.insight_id)}
              className="text-[10px] text-primary hover:underline mt-1.5"
            >
              View source insight
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
