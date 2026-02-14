import { useEffect, useState, useRef, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Award, ArrowLeft, Play, FlaskConical, Sparkles } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import type { AgenticScenarioItem } from "@/stores/simulationStore";
import { simulationsApi } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";
import { scenarioToSimTemplate, scenarioToNodeParams } from "@/lib/agenticScenario";
import type { AgenticScenarioRaw } from "@/lib/agenticScenario";
import type { SimulationResults } from "@/types/simulation";
import { SimulationCanvas } from "./SimulationCanvas";
import { NodeInspector } from "./NodeInspector";
import { SimulationProgress } from "./SimulationProgress";
import { FanChart } from "./results/FanChart";
import { TornadoChart } from "./results/TornadoChart";
import { HistogramChart } from "./results/HistogramChart";
import { ScenarioTable } from "./results/ScenarioTable";
import { VaRCard } from "./results/VaRCard";
import { ArtifactPreview, type Artifact } from "./ArtifactPreview";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSimulation } from "@/hooks/useSimulation";

/** Split summary into bullet lines (newline or sentence); filter empty. */
function summaryToBullets(summary: string): string[] {
  const raw = summary
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!])\s+/))
    .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
  return raw.length > 0 ? raw : [summary.trim()];
}

/** Render a line with **bold** segments as <strong>. */
function renderLineWithBold(line: string): ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      p
    )
  );
}

function completedEventToResults(completed: Record<string, unknown>): SimulationResults {
  return {
    fanChart: (completed.fan_chart as SimulationResults["fanChart"]) ?? null,
    tornadoChart: (completed.tornado_chart as SimulationResults["tornadoChart"]) ?? null,
    histogram: (completed.histogram as SimulationResults["histogram"]) ?? null,
    scenarioTable: (completed.scenario_table as SimulationResults["scenarioTable"]) ?? null,
    varCard: (completed.var_card as SimulationResults["varCard"]) ?? null,
    summary: (completed.summary as string) ?? null,
  };
}

function buildScenarioItemsFromRaw(
  rawList: AgenticScenarioRaw[],
  comparisonScenarios?: Array<{ scenario_id?: string; [key: string]: unknown }>
): AgenticScenarioItem[] {
  return rawList.map((raw) => {
    const template = scenarioToSimTemplate(raw);
    const nodeParams = scenarioToNodeParams(raw);
    const comp = comparisonScenarios?.find(
      (c) => (c.scenario_id ?? c.id) === raw.id
    );
    const results: SimulationResults | null = comp
      ? {
          fanChart: (comp.fan_chart as SimulationResults["fanChart"]) ?? null,
          tornadoChart: (comp.tornado_chart as SimulationResults["tornadoChart"]) ?? null,
          histogram: (comp.histogram as SimulationResults["histogram"]) ?? null,
          scenarioTable: (comp.scenario_table as SimulationResults["scenarioTable"]) ?? null,
          varCard: (comp.var_card as SimulationResults["varCard"]) ?? null,
          summary: (comp.summary as string) ?? null,
        }
      : null;
    return {
      id: raw.id,
      name: raw.name,
      template,
      nodeParams,
      results,
    };
  });
}

export const AgenticSimulationView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    scenarios,
    selectedScenario,
    selectedTemplate,
    activeTab,
    setActiveTab,
    comparisonData,
    artifacts,
    isRunning,
    progress,
    thinkingSteps,
    fanChart,
    tornadoChart,
    histogram,
    scenarioTable,
    varCard,
    summary,
    insightId: insightIdFromStore,
    setScenarios,
    setSelectedScenario,
    setComparisonData,
    setArtifacts,
    setAgenticScenarioResults,
    setIsRunning,
    addProgress,
    addThinkingStep,
    setAgenticMode,
  } = useSimulationStore();
  const insightIdFromUrl = searchParams.get("insightId");
  const insightId = insightIdFromUrl || insightIdFromStore;

  const { runSimulation: runSim, stopSimulation: stopSim } = useSimulation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<SSEConnection | null>(null);

  // When run completes in agentic mode, persist results to current scenario
  const prevRunningRef = useRef(false);
  useEffect(() => {
    const state = useSimulationStore.getState();
    const nowRunning = state.isRunning;
    if (prevRunningRef.current && !nowRunning && state.agenticMode && state.selectedScenario) {
      const r = state.fanChart || state.tornadoChart || state.histogram || state.scenarioTable || state.varCard || state.summary;
      if (r) {
        state.setAgenticScenarioResults(state.selectedScenario, {
          fanChart: state.fanChart,
          tornadoChart: state.tornadoChart,
          histogram: state.histogram,
          scenarioTable: state.scenarioTable,
          varCard: state.varCard,
          summary: state.summary,
        });
      }
    }
    prevRunningRef.current = nowRunning;
  });

  // Load cached results or trigger new simulation
  useEffect(() => {
    if (!insightId) {
      setError("Missing insight. Open an insight and try Run Simulation again.");
      setLoading(false);
      return;
    }

    // Ensure store reflects agentic mode when we're on agentic URL (e.g. after refresh or direct nav).
    // Otherwise setSelectedScenario won't sync template/results and post-run persistence won't run.
    setAgenticMode(true, insightId);

    const loadSimulation = async () => {
      try {
        const cached = await simulationsApi.getAgentic(insightId);
        const rawScenarios = cached?.scenarios as AgenticScenarioRaw[] | undefined;
        const compData = cached?.comparison_data as { scenarios?: Array<{ scenario_id?: string; [key: string]: unknown }> } | undefined;

        if (rawScenarios && Array.isArray(rawScenarios) && rawScenarios.length > 0) {
          const items = buildScenarioItemsFromRaw(
            rawScenarios,
            compData?.scenarios
          );
          setScenarios(items);
          setSelectedScenario((cached as { winning_scenario_id?: string }).winning_scenario_id ?? items[0]?.id ?? null);
          setComparisonData(compData ?? cached?.comparison_data ?? null);
          setArtifacts(Array.isArray(cached?.artifacts) ? cached.artifacts : []);
          setLoading(false);
          return;
        }
      } catch {
        // No cached results, trigger new simulation
      }

      setIsRunning(true);
      setLoading(false);

      const url = simulationsApi.triggerAgenticUrl();
      const body = { insight_id: insightId };

      connectionRef.current = connectPostSSE(
        url,
        (event) => {
          switch (event.type) {
            case "progress":
              addProgress(event.data.step as string);
              break;
            case "thinking":
              addThinkingStep(event.data.content as string);
              break;
            case "scenarios_generated": {
              const rawList = (event.data.scenarios as AgenticScenarioRaw[]) ?? [];
              const items = rawList.map((raw) => ({
                id: raw.id,
                name: raw.name,
                template: scenarioToSimTemplate(raw),
                nodeParams: scenarioToNodeParams(raw),
                results: null as SimulationResults | null,
              }));
              setScenarios(items);
              if (items.length > 0) {
                setSelectedScenario(items[0].id);
              }
              break;
            }
            case "scenario_complete": {
              const completed = event.data as Record<string, unknown> & { scenario_id?: string };
              const scenarioId = completed?.scenario_id;
              if (scenarioId) {
                const results = completedEventToResults(completed);
                setAgenticScenarioResults(scenarioId, results);
              }
              break;
            }
            case "comparison_ready":
              setComparisonData(event.data);
              setSelectedScenario((event.data as { winning_scenario_id?: string }).winning_scenario_id ?? null);
              break;
            case "artifacts_ready":
              setArtifacts(
                ((event.data as { artifacts?: Array<{ type: string; content: string; title: string; metadata?: unknown }> }).artifacts ?? []) as Array<{ type: string; content: string; title: string; metadata?: unknown }>
              );
              break;
            case "complete":
              setIsRunning(false);
              if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
              }
              break;
            case "error":
              setError((event.data as { message?: string }).message ?? "Simulation failed");
              setIsRunning(false);
              if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
              }
              break;
          }
        },
        () => {
          setError("Simulation failed. Check that the backend is running and try again.");
          setIsRunning(false);
          if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
          }
        },
        () => {
          setIsRunning(false);
          if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
          }
        },
        body,
      );
    };

    loadSimulation();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
  }, [insightId]);

  if (loading) {
    return (
      <div className="min-h-full w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full w-full bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setAgenticMode(false);
            navigate("/simulations");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulations
        </Button>
      </div>
    );
  }

  const scenarioIds = scenarios.map((s) => s.id);
  const activeScenarioId =
    selectedScenario && scenarioIds.includes(selectedScenario)
      ? selectedScenario
      : scenarios[0]?.id ?? undefined;
  const currentScenario = scenarios.find((s) => s.id === activeScenarioId);
  const hasResults =
    fanChart || tornadoChart || histogram || scenarioTable || varCard || summary;

  if (scenarios.length === 0) {
    return (
      <div className="min-h-full w-full bg-background flex flex-col items-center justify-center gap-4 p-6">
        {isRunning ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {progress[progress.length - 1] || "Generating scenarios..."}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No scenarios yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Strategic Simulation</h1>
            <p className="text-sm text-muted-foreground">
              {currentScenario?.name ?? "Select a scenario"} — graph and results
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setAgenticMode(false);
              navigate("/simulations");
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Tabs
          value={activeScenarioId}
          onValueChange={(v) => setSelectedScenario(v)}
          className="w-full"
        >
          <TabsList>
            {scenarios.map((scenario) => (
              <TabsTrigger key={scenario.id} value={scenario.id}>
                {scenario.name}
                {scenario.id === (comparisonData as { winning_scenario_id?: string } | null)?.winning_scenario_id && (
                  <Award className="h-3 w-3 ml-1.5 text-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Per-tab: Graph + NodeInspector + Results (same layout as SimulationsPage) */}
      {currentScenario && selectedTemplate && (
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "graph" | "results")}
            className="flex flex-col h-full flex-1"
          >
            <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold truncate">{currentScenario.name}</h2>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 cursor-default truncate">
                          {currentScenario.template.subtitle || "Scenario"}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-sm p-3 text-left text-sm">
                        {currentScenario.template.subtitle || "Scenario"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <TabsList>
                  <TabsTrigger value="graph" className="text-xs">
                    Graph
                  </TabsTrigger>
                  <TabsTrigger value="results" className="text-xs">
                    Results
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={stopSim}
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running...
                  </Button>
                ) : (
                  <Button size="sm" className="gap-2" onClick={runSim}>
                    <Play className="h-3.5 w-3.5" />
                    Run Simulation
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="graph" className="flex-1 m-0 min-h-0 flex flex-col data-[state=active]:flex">
              <div className="flex flex-1 min-h-[378px]">
                <div className="flex-1 min-w-0 min-h-[378px]">
                  <SimulationCanvas />
                </div>
                <NodeInspector />
              </div>
              {summary && (
                <div className="shrink-0 border-t border-border px-4 py-4 bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Key outcomes at a glance</p>
                  <ul className="text-base text-foreground/90 space-y-2 list-disc list-inside marker:text-primary/70">
                    {summaryToBullets(summary).map((line, i) => (
                      <li key={i}>{renderLineWithBold(line)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="flex-1 m-0 overflow-y-auto">
              <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {isRunning && (
                  <SimulationProgress
                    progress={progress}
                    thinkingSteps={thinkingSteps}
                  />
                )}

                {!isRunning && !hasResults && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <FlaskConical className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <h2 className="text-lg font-medium">No results yet</h2>
                      <p className="text-sm text-muted-foreground">
                        Adjust parameters in the Graph tab, then click &quot;Run Simulation&quot;
                      </p>
                    </div>
                    <Button size="sm" className="gap-2" onClick={runSim}>
                      <Play className="h-3.5 w-3.5" />
                      Run Simulation
                    </Button>
                  </div>
                )}

                {summary && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium mb-2">
                            Key outcomes at a glance
                          </h3>
                          <ul className="text-base text-muted-foreground space-y-2 list-disc list-inside marker:text-primary/70">
                            {summaryToBullets(summary).map((line, i) => (
                              <li key={i}>{renderLineWithBold(line)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FanChart
                  data={fanChart}
                  loading={isRunning && !fanChart}
                  simulationName={currentScenario.id}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TornadoChart
                    data={tornadoChart}
                    loading={isRunning && !tornadoChart}
                    simulationName={currentScenario.id}
                  />
                  <HistogramChart
                    data={histogram}
                    loading={isRunning && !histogram}
                    simulationName={currentScenario.id}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScenarioTable
                    data={scenarioTable}
                    loading={isRunning && !scenarioTable}
                    simulationName={currentScenario.id}
                  />
                  <VaRCard
                    data={varCard}
                    loading={isRunning && !varCard}
                    simulationName={currentScenario.id}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="border-t border-border p-6">
          <ArtifactPreview artifacts={artifacts as Artifact[]} />
        </div>
      )}
    </div>
  );
};
