import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipboardList, Filter, Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useActionPlanStore } from "@/stores/actionPlanStore";
import { insightsApi } from "@/lib/api";
import { ActionCard } from "./ActionCard";

export const ActionPlanView = () => {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const planActions = useActionPlanStore((s) => s.planActions);
  const setPlanActions = useActionPlanStore((s) => s.setPlanActions);
  const togglePlanAction = useActionPlanStore((s) => s.togglePlanAction);
  const openWizard = useActionPlanStore((s) => s.openWizard);

  const [isLoading, setIsLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [effortFilter, setEffortFilter] = useState<string>("all");

  useEffect(() => {
    if (!activeDataset) return;
    setIsLoading(true);
    insightsApi
      .getActionPlan(activeDataset.id)
      .then((actions) => {
        // Don't overwrite a non-empty plan with empty API response (e.g. after "Add All" before refetch)
        const current = useActionPlanStore.getState().planActions;
        if (actions.length > 0 || current.length === 0) {
          setPlanActions(actions);
        }
      })
      .catch(() => {
        const current = useActionPlanStore.getState().planActions;
        if (current.length === 0) setPlanActions([]);
      })
      .finally(() => setIsLoading(false));
  }, [activeDataset, setPlanActions]);

  const filtered = useMemo(() => {
    let result = planActions;
    if (priorityFilter !== "all") {
      result = result.filter((a) => a.priority === priorityFilter);
    }
    if (effortFilter !== "all") {
      result = result.filter((a) => a.effort === effortFilter);
    }
    return result;
  }, [planActions, priorityFilter, effortFilter]);

  const uniqueInsights = new Set(planActions.map((a) => a.insight_id)).size;

  const handleRemoveFromPlan = async (actionId: string) => {
    togglePlanAction(actionId);
    try {
      await insightsApi.toggleActionPlan(actionId);
      // Remove from planActions
      setPlanActions(planActions.filter((a) => a.id !== actionId));
    } catch {
      togglePlanAction(actionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading action plan...
        </div>
      </div>
    );
  }

  if (planActions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No actions yet</p>
        <p className="text-xs mt-1">
          Explore insights to generate and add actions to your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <ClipboardList className="h-3 w-3" />
            {planActions.length} action{planActions.length !== 1 ? "s" : ""} from{" "}
            {uniqueInsights} insight{uniqueInsights !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Filter className="h-3 w-3" />
                Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Filter className="h-3 w-3" />
                Effort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={effortFilter}
                onValueChange={setEffortFilter}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="quick_win">Quick Win</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="moderate">Moderate</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="major">Major</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Action cards */}
      <div className="space-y-3">
        {filtered.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onTogglePlan={handleRemoveFromPlan}
            showInsightLink
            onInsightClick={openWizard}
          />
        ))}
      </div>

      {filtered.length === 0 && planActions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No actions match the current filters.
        </p>
      )}
    </div>
  );
};
