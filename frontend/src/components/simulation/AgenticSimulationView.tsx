import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Award, ArrowLeft } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import { simulationsApi } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";
import { FanChart } from "./results/FanChart";
import { ArtifactPreview } from "./ArtifactPreview";

export const AgenticSimulationView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    scenarios,
    selectedScenario,
    comparisonData,
    artifacts,
    isRunning,
    progress,
    thinkingSteps,
    insightId: insightIdFromStore,
    setScenarios,
    setSelectedScenario,
    setComparisonData,
    setArtifacts,
    setIsRunning,
    addProgress,
    addThinkingStep,
    setAgenticMode,
  } = useSimulationStore();
  const insightIdFromUrl = searchParams.get("insightId");
  const insightId = insightIdFromUrl || insightIdFromStore;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<SSEConnection | null>(null);

  // Load cached results or trigger new simulation
  useEffect(() => {
    if (!insightId) {
      setError(
        "Missing insight. Open an insight and try Run Simulation again."
      );
      setLoading(false);
      return;
    }

    const loadSimulation = async () => {
      try {
        // Try to load cached results first
        const cached = await simulationsApi.getAgentic(insightId);
        
        if (cached?.comparison_data) {
          const scenariosList = Array.isArray(cached.comparison_data.scenarios)
            ? cached.comparison_data.scenarios
            : [];
          setScenarios(
            scenariosList.map((s: { scenario_id?: string; scenario_name?: string }) => ({
              id: s.scenario_id ?? "",
              name: s.scenario_name ?? "Scenario",
              results: s,
            }))
          );
          setSelectedScenario(cached.winning_scenario_id ?? null);
          setComparisonData(cached.comparison_data);
          setArtifacts(Array.isArray(cached.artifacts) ? cached.artifacts : []);
          setLoading(false);
          return;
        }
      } catch {
        // No cached results, trigger new simulation
      }

      // Trigger new simulation
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
            case "scenarios_generated":
              setScenarios(
                (event.data.scenarios as any[]).map((s) => ({
                  id: s.id,
                  name: s.name,
                  results: null,
                }))
              );
              break;
            case "scenario_complete":
              const completed = event.data as any;
              setScenarios((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.map((s) =>
                  s.id === completed?.scenario_id
                    ? { ...s, results: completed }
                    : s
                );
              });
              break;
            case "comparison_ready":
              const compData = event.data as any;
              setComparisonData(compData);
              setSelectedScenario(compData.winning_scenario_id);
              break;
            case "artifacts_ready":
              setArtifacts(event.data.artifacts as any[]);
              break;
            case "complete":
              setIsRunning(false);
              if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
              }
              break;
            case "error":
              setError(event.data.message as string);
              setIsRunning(false);
              if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
              }
              break;
          }
        },
        () => {
          setError(
            "Simulation failed. Check that the backend is running and try again."
          );
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
  const activeTab =
    selectedScenario && scenarioIds.includes(selectedScenario)
      ? selectedScenario
      : scenarios[0]?.id ?? undefined;
  const winningScenario = scenarios.find((s) => s.id === (activeTab ?? selectedScenario));
  const baselineFanChart = comparisonData?.baseline?.fan_chart;

  return (
    <div className="min-h-full w-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Strategic Simulation</h1>
            <p className="text-sm text-muted-foreground">
              Comparing Status Quo vs Opus Strategy
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

        {/* Scenario tabs */}
        {scenarios.length > 0 && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setSelectedScenario(v)}
          >
            <TabsList>
              {scenarios.map((scenario) => (
                <TabsTrigger key={scenario.id} value={scenario.id}>
                  {scenario.name}
                  {scenario.id === comparisonData?.winning_scenario_id && (
                    <Award className="h-3 w-3 ml-1.5 text-primary" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Split-screen comparison */}
      <div className="flex-1 overflow-y-auto p-6">
        {isRunning && scenarios.length === 0 ? (
          <div className="min-h-[400px] w-full bg-background flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="text-sm font-medium mb-1">Generating scenarios...</h3>
              <p className="text-xs text-muted-foreground">
                {progress[progress.length - 1] || "Initializing"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Status Quo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Quo</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Baseline projection (no intervention)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {baselineFanChart ? (
                  <FanChart
                    data={baselineFanChart}
                    loading={false}
                    simulationName="baseline"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    Baseline data loading...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Opus Strategy */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Opus Strategy</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {winningScenario?.name || "Selected strategy"}
                    </p>
                  </div>
                  {winningScenario?.id === comparisonData?.winning_scenario_id && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Award className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {winningScenario?.results?.fan_chart ? (
                  <>
                    <FanChart
                      data={winningScenario.results.fan_chart}
                      loading={false}
                      simulationName={winningScenario.id}
                    />
                    {winningScenario.results.summary && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                        {winningScenario.results.summary}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    {isRunning ? "Running simulation..." : "No results yet"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Artifacts section */}
        {artifacts.length > 0 && (
          <div className="mt-6">
            <ArtifactPreview artifacts={artifacts} />
          </div>
        )}
      </div>
    </div>
  );
};
