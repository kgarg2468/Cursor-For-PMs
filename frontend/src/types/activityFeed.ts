export type ActivityStepStatus = "pending" | "running" | "completed" | "error";
export type ActivityFlowType =
  | "agentic-simulation"
  | "simulation"
  | "insight-generation"
  | "copilot"
  | "chat";

export interface ActivitySubTask {
  id: string;
  label: string;
  status: ActivityStepStatus;
  metricLabel?: string;
}

export interface ActivityStep {
  id: string;
  status: ActivityStepStatus;
  icon: string;
  title: string;
  subtitle?: string;
  subTasks: ActivitySubTask[];
  previewType?:
    | "scenarios-list"
    | "scenario-metric"
    | "insight-card"
    | "kpi-summary"
    | null;
  previewData?: Record<string, unknown>;
  thinkingText?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ActivityFeedState {
  flowType: ActivityFlowType | null;
  flowId: string | null;
  steps: ActivityStep[];
  isActive: boolean;
  isComplete: boolean;
  showFeed: boolean;
  transitionPhase: "feed" | "transitioning" | "results";
}
