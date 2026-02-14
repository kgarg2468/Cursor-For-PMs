import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FlaskConical, Play, Loader2, Sparkles } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import { useSimulation } from "@/hooks/useSimulation";
import { TemplatePicker } from "@/components/simulation/TemplatePicker";
import { SimulationCanvas } from "@/components/simulation/SimulationCanvas";
import { NodeInspector } from "@/components/simulation/NodeInspector";
import { SimulationProgress } from "@/components/simulation/SimulationProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgenticSimulationView } from "@/components/simulation/AgenticSimulationView";
import { FanChart } from "@/components/simulation/results/FanChart";
import { TornadoChart } from "@/components/simulation/results/TornadoChart";
import { HistogramChart } from "@/components/simulation/results/HistogramChart";
import { ScenarioTable } from "@/components/simulation/results/ScenarioTable";
import { VaRCard } from "@/components/simulation/results/VaRCard";
import { Card, CardContent } from "@/components/ui/card";

export const SimulationsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agenticMode = searchParams.get("mode") === "agentic";
  const agenticModeFromStore = useSimulationStore((s) => s.agenticMode);
  const insightIdFromStore = useSimulationStore((s) => s.insightId);

  const selectedTemplate = useSimulationStore((s) => s.selectedTemplate);
  const activeTab = useSimulationStore((s) => s.activeTab);
  const setActiveTab = useSimulationStore((s) => s.setActiveTab);

  // When store has agentic context but URL has no params, sync URL so nav link preserves it
  useEffect(() => {
    if (agenticModeFromStore && insightIdFromStore && !agenticMode) {
      navigate(
        `/simulations?mode=agentic&insightId=${insightIdFromStore}`,
        { replace: true }
      );
    }
  }, [agenticModeFromStore, insightIdFromStore, agenticMode, navigate]);

  // Show agentic view if in agentic mode (height-guaranteed wrapper so main gets a real height)
  if (agenticMode || agenticModeFromStore) {
    return (
      <div className="min-h-full min-h-0 flex-1 flex flex-col w-full bg-background">
        <ErrorBoundary
          fallbackTitle="Simulation view error"
          fallbackMessage="An error occurred while loading the simulation. Try going back and running the simulation again."
        >
          <AgenticSimulationView />
        </ErrorBoundary>
      </div>
    );
  }

  const {
    isRunning,
    progress,
    thinkingSteps,
    fanChart,
    tornadoChart,
    histogram,
    scenarioTable,
    varCard,
    summary,
    runSimulation,
    stopSimulation,
  } = useSimulation();

  // No template selected — show full-page picker
  if (!selectedTemplate) {
    return <TemplatePicker />;
  }

  const hasResults =
    fanChart || tornadoChart || histogram || scenarioTable || varCard || summary;

  return (
    <div className="flex h-full">
      {/* Left sidebar: Template Picker */}
      <TemplatePicker compact />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "graph" | "results")}
          className="flex flex-col h-full"
        >
          {/* Header with tabs + run button */}
          <div className="shrink-0 border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-sm font-semibold">
                  {selectedTemplate.name}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTemplate.subtitle}
                </p>
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
                  onClick={stopSimulation}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={runSimulation}>
                  <Play className="h-3.5 w-3.5" />
                  Run Simulation
                </Button>
              )}
            </div>
          </div>

          {/* Graph Tab */}
          <TabsContent value="graph" className="flex-1 m-0">
            <div className="flex h-full">
              <div className="flex-1">
                <SimulationCanvas />
              </div>
              <NodeInspector />
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="flex-1 m-0 overflow-y-auto">
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
              {/* Running state */}
              {isRunning && (
                <SimulationProgress
                  progress={progress}
                  thinkingSteps={thinkingSteps}
                />
              )}

              {/* Empty state */}
              {!isRunning && !hasResults && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-medium">No results yet</h2>
                    <p className="text-sm text-muted-foreground">
                      Adjust parameters in the Graph tab, then click "Run
                      Simulation"
                    </p>
                  </div>
                  <Button size="sm" className="gap-2" onClick={runSimulation}>
                    <Play className="h-3.5 w-3.5" />
                    Run Simulation
                  </Button>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">
                          Executive Summary
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {summary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fan Chart — full width */}
              <FanChart
                data={fanChart}
                loading={isRunning && !fanChart}
                simulationName={selectedTemplate.id}
              />

              {/* Tornado + Histogram side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TornadoChart
                  data={tornadoChart}
                  loading={isRunning && !tornadoChart}
                  simulationName={selectedTemplate.id}
                />
                <HistogramChart
                  data={histogram}
                  loading={isRunning && !histogram}
                  simulationName={selectedTemplate.id}
                />
              </div>

              {/* Scenario Table + VaR side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScenarioTable
                  data={scenarioTable}
                  loading={isRunning && !scenarioTable}
                  simulationName={selectedTemplate.id}
                />
                <VaRCard
                  data={varCard}
                  loading={isRunning && !varCard}
                  simulationName={selectedTemplate.id}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
