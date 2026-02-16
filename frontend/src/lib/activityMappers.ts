import type { ActivityStep } from "@/types/activityFeed";
import { useActivityFeedStore } from "@/stores/activityFeedStore";

type FeedStore = typeof useActivityFeedStore extends { getState: () => infer S }
  ? S
  : never;

/** Convenience: get the currently-running step id. */
function runningStepId(store: FeedStore): string | null {
  const running = store.steps.find((s) => s.status === "running");
  return running?.id ?? null;
}

/** Helper to create a step and auto-complete the previous running step. */
function transitionToStep(store: FeedStore, step: ActivityStep) {
  const prev = runningStepId(store);
  if (prev) store.completeStep(prev);
  store.addStep(step);
}

// ---------------------------------------------------------------------------
// Agentic Simulation Mapper
// ---------------------------------------------------------------------------

/** Track scenario count for sub-task creation. */
let agenticScenarioNames: string[] = [];

export function mapAgenticSimulationEvent(
  event: { type: string; data: Record<string, unknown> },
  store: FeedStore
) {
  const progressText = (event.data?.step as string) ?? "";

  switch (event.type) {
    case "progress": {
      // Step 1: Loading insight context
      if (progressText.toLowerCase().includes("loading insight") || progressText.toLowerCase().includes("fetching insight")) {
        transitionToStep(store, {
          id: "agentic-load",
          status: "running",
          icon: "Search",
          title: "Loading insight context",
          subtitle: progressText,
          subTasks: [],
        });
        return;
      }

      // Step 2: Designing scenarios
      if (
        progressText.toLowerCase().includes("generating") &&
        (progressText.toLowerCase().includes("scenario") || progressText.toLowerCase().includes("strateg"))
      ) {
        transitionToStep(store, {
          id: "agentic-design",
          status: "running",
          icon: "Brain",
          title: "Designing strategic scenarios",
          subtitle: progressText,
          subTasks: [],
        });
        return;
      }

      // Step 3: Running simulations
      if (progressText.toLowerCase().includes("running") && progressText.toLowerCase().includes("simulation")) {
        transitionToStep(store, {
          id: "agentic-run",
          status: "running",
          icon: "FlaskConical",
          title: "Running simulations",
          subtitle: progressText,
          subTasks: agenticScenarioNames.map((name, i) => ({
            id: `scenario-${i}`,
            label: name,
            status: "pending" as const,
          })),
        });
        // Mark first as running
        if (agenticScenarioNames.length > 0) {
          store.updateSubTask("agentic-run", "scenario-0", { status: "running" });
        }
        return;
      }

      // Step 4: Comparing results
      if (progressText.toLowerCase().includes("compar")) {
        transitionToStep(store, {
          id: "agentic-compare",
          status: "running",
          icon: "Scale",
          title: "Comparing results",
          subtitle: progressText,
          subTasks: [],
        });
        return;
      }

      // Step 5: Generating artifacts
      if (progressText.toLowerCase().includes("artifact") || progressText.toLowerCase().includes("generating document")) {
        transitionToStep(store, {
          id: "agentic-artifacts",
          status: "running",
          icon: "FileText",
          title: "Generating artifacts",
          subtitle: progressText,
          subTasks: [],
        });
        return;
      }

      // Generic progress — update subtitle of current running step
      const currentId = runningStepId(store);
      if (currentId) {
        store.updateStep(currentId, { subtitle: progressText });
      }
      break;
    }

    case "thinking": {
      const currentId = runningStepId(store);
      if (currentId) {
        store.appendThinking(currentId, (event.data.content as string) ?? "");
      }
      break;
    }

    case "scenarios_generated": {
      const scenarios = (event.data.scenarios as Array<{ id: string; name: string }>) ?? [];
      agenticScenarioNames = scenarios.map((s) => s.name);

      // Add scenario names as sub-tasks on the design step
      store.completeStep("agentic-design");
      store.setStepPreview("agentic-design", "scenarios-list", {
        scenarios: scenarios.map((s) => ({ id: s.id, name: s.name })),
      });
      break;
    }

    case "scenario_started": {
      const scenarioId = event.data.scenario_id as string;
      // Find matching sub-task and set running
      const runStep = store.steps.find((s) => s.id === "agentic-run");
      if (runStep) {
        const subTask = runStep.subTasks.find(
          (st) => st.status === "pending" || st.label.toLowerCase().includes((scenarioId ?? "").toLowerCase())
        );
        if (subTask) {
          store.updateSubTask("agentic-run", subTask.id, { status: "running" });
        }
      }
      break;
    }

    case "scenario_complete": {
      const scenarioId = event.data.scenario_id as string;
      const varCard = event.data.var_card as Record<string, unknown> | undefined;
      const metricLabel = varCard
        ? `VaR: ${(varCard.value as string) ?? ""}`
        : undefined;

      // Find sub-task matching this scenario
      const runStep = store.steps.find((s) => s.id === "agentic-run");
      if (runStep) {
        // Try to find by scenario index (based on order)
        const subTask = runStep.subTasks.find(
          (st) => st.status === "running" || st.status === "pending"
        );
        if (subTask) {
          store.completeSubTask("agentic-run", subTask.id, metricLabel);
          // Mark next pending as running
          const nextPending = runStep.subTasks.find(
            (st) => st.id !== subTask.id && st.status === "pending"
          );
          if (nextPending) {
            store.updateSubTask("agentic-run", nextPending.id, { status: "running" });
          }
        }
      }

      // Add preview data
      if (varCard) {
        store.setStepPreview("agentic-run", "scenario-metric", {
          scenarioId,
          ...varCard,
        });
      }
      break;
    }

    case "comparison_ready": {
      store.completeStep("agentic-compare");
      break;
    }

    case "artifacts_ready": {
      store.completeStep("agentic-artifacts");
      break;
    }

    case "complete": {
      agenticScenarioNames = [];
      store.completeFeed();
      break;
    }

    case "error": {
      const currentId = runningStepId(store);
      if (currentId) {
        store.setStepError(currentId);
      }
      agenticScenarioNames = [];
      store.completeFeed();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Regular Simulation Mapper
// ---------------------------------------------------------------------------

export function mapSimulationEvent(
  event: { type: string; data: Record<string, unknown> },
  store: FeedStore
) {
  switch (event.type) {
    case "progress": {
      const step = (event.data.step as string) ?? "";

      // Only create initial step if none exists
      if (store.steps.length === 0) {
        store.addStep({
          id: "sim-setup",
          status: "running",
          icon: "FlaskConical",
          title: "Preparing simulation",
          subtitle: step,
          subTasks: [],
        });
      } else if (step.toLowerCase().includes("claude") || step.toLowerCase().includes("analyz")) {
        transitionToStep(store, {
          id: "sim-analyze",
          status: "running",
          icon: "Brain",
          title: "Analyzing causal chain",
          subtitle: step,
          subTasks: [],
        });
      } else {
        const currentId = runningStepId(store);
        if (currentId) store.updateStep(currentId, { subtitle: step });
      }
      break;
    }

    case "thinking": {
      const currentId = runningStepId(store);
      if (currentId) {
        store.appendThinking(currentId, (event.data.content as string) ?? "");
      }
      // If no step yet, create one
      if (!currentId) {
        store.addStep({
          id: "sim-thinking",
          status: "running",
          icon: "Brain",
          title: "Reasoning through model",
          subTasks: [],
        });
        store.appendThinking("sim-thinking", (event.data.content as string) ?? "");
      }
      break;
    }

    case "fan_chart":
    case "tornado_chart":
    case "histogram":
    case "scenario_table":
    case "var_card": {
      // Transition to results-building step
      if (!store.steps.find((s) => s.id === "sim-results")) {
        transitionToStep(store, {
          id: "sim-results",
          status: "running",
          icon: "BarChart3",
          title: "Building results",
          subTasks: [],
        });
      }
      const chartLabel =
        event.type === "fan_chart" ? "Fan chart" :
        event.type === "tornado_chart" ? "Tornado chart" :
        event.type === "histogram" ? "Histogram" :
        event.type === "scenario_table" ? "Scenario table" :
        "Value at Risk";

      store.addSubTask("sim-results", {
        id: event.type,
        label: chartLabel,
        status: "completed",
      });
      break;
    }

    case "summary": {
      if (store.steps.find((s) => s.id === "sim-results")) {
        store.addSubTask("sim-results", {
          id: "summary",
          label: "Executive summary",
          status: "completed",
        });
      }
      break;
    }

    case "complete":
      store.completeFeed();
      break;

    case "error": {
      const currentId = runningStepId(store);
      if (currentId) store.setStepError(currentId);
      store.completeFeed();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Insight Generation Mapper
// ---------------------------------------------------------------------------

let insightCount = 0;

export function mapInsightGenerationEvent(
  event: { type: string; data: Record<string, unknown> },
  store: FeedStore
) {
  switch (event.type) {
    case "progress": {
      const step = (event.data.step as string) ?? "";

      if (step.toLowerCase().includes("loading") || step.toLowerCase().includes("dataset")) {
        if (!store.steps.find((s) => s.id === "insight-load")) {
          store.addStep({
            id: "insight-load",
            status: "running",
            icon: "Database",
            title: "Loading dataset",
            subtitle: step,
            subTasks: [],
          });
        }
      } else if (step.toLowerCase().includes("computing") || step.toLowerCase().includes("metric") || step.toLowerCase().includes("kpi")) {
        transitionToStep(store, {
          id: "insight-metrics",
          status: "running",
          icon: "BarChart3",
          title: "Computing metrics",
          subtitle: step,
          subTasks: [],
        });
      } else if (step.toLowerCase().includes("analyz") || step.toLowerCase().includes("pattern")) {
        transitionToStep(store, {
          id: "insight-analyze",
          status: "running",
          icon: "Brain",
          title: "Analyzing patterns",
          subtitle: step,
          subTasks: [],
        });
      } else if (step.toLowerCase().includes("generating") || step.toLowerCase().includes("processing")) {
        if (!store.steps.find((s) => s.id === "insight-process")) {
          transitionToStep(store, {
            id: "insight-process",
            status: "running",
            icon: "Sparkles",
            title: "Processing insights",
            subtitle: step,
            subTasks: [],
          });
          insightCount = 0;
        }
      } else {
        const currentId = runningStepId(store);
        if (currentId) store.updateStep(currentId, { subtitle: step });
      }
      break;
    }

    case "thinking": {
      const currentId = runningStepId(store);
      if (currentId) {
        store.appendThinking(currentId, (event.data.content as string) ?? "");
      }
      break;
    }

    case "kpis": {
      if (store.steps.find((s) => s.id === "insight-metrics")) {
        store.completeStep("insight-metrics");
        store.setStepPreview("insight-metrics", "kpi-summary", event.data);
      }
      break;
    }

    case "insight": {
      insightCount++;
      const title = (event.data.title as string) ?? `Insight ${insightCount}`;

      // Ensure process step exists
      if (!store.steps.find((s) => s.id === "insight-process")) {
        transitionToStep(store, {
          id: "insight-process",
          status: "running",
          icon: "Sparkles",
          title: "Processing insights",
          subTasks: [],
        });
      }

      store.addSubTask("insight-process", {
        id: `insight-${insightCount}`,
        label: title,
        status: "completed",
      });

      store.setStepPreview("insight-process", "insight-card", {
        count: insightCount,
        latestTitle: title,
        latestType: (event.data.type as string) ?? "",
      });
      break;
    }

    case "complete":
      insightCount = 0;
      store.completeFeed();
      break;

    case "error": {
      insightCount = 0;
      const currentId = runningStepId(store);
      if (currentId) store.setStepError(currentId);
      store.completeFeed();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Chat Mapper (lightweight)
// ---------------------------------------------------------------------------

export function mapChatEvent(
  event: { type: string; data: Record<string, unknown> },
  store: FeedStore
) {
  switch (event.type) {
    case "thinking": {
      if (store.steps.length === 0) {
        store.addStep({
          id: "chat-thinking",
          status: "running",
          icon: "Brain",
          title: "Thinking...",
          subTasks: [],
        });
      }
      store.appendThinking("chat-thinking", (event.data.content as string) ?? "");
      break;
    }

    case "text_start":
    case "text": {
      if (store.steps.find((s) => s.id === "chat-thinking")) {
        store.completeStep("chat-thinking");
      }
      store.completeFeed();
      break;
    }

    case "complete":
      store.completeFeed();
      break;

    case "error": {
      const currentId = runningStepId(store);
      if (currentId) store.setStepError(currentId);
      store.completeFeed();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Copilot Mapper
// ---------------------------------------------------------------------------

export function mapCopilotEvent(
  event: { type: string; data: Record<string, unknown> },
  store: FeedStore,
  phase: "generating" | "simulating"
) {
  if (phase === "generating") {
    // Classify step
    if (store.steps.length === 0) {
      store.addStep({
        id: "copilot-classify",
        status: "completed",
        icon: "Search",
        title: "Understanding your request",
        subTasks: [],
        completedAt: Date.now(),
      });
    }
    mapInsightGenerationEvent(event, store);
  } else {
    mapAgenticSimulationEvent(event, store);
  }
}
