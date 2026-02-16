import { ResponsiveBar } from "@nivo/bar";
import type { TornadoChartData } from "@/types/simulation";
import { ResultCard } from "./ResultCard";

interface TornadoChartProps {
  data: TornadoChartData | null;
  loading?: boolean;
  simulationName?: string;
}

export const TornadoChart = ({
  data,
  loading,
  simulationName,
}: TornadoChartProps) => {
  if (!data && !loading) return null;

  const chartData =
    data?.factors
      .sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low))
      .map((f) => ({
        factor: f.factor,
        low: f.low - f.base,
        high: f.high - f.base,
      })) ?? [];

  return (
    <ResultCard
      title={data?.title ?? "Sensitivity Analysis"}
      subtitle="Impact of each variable on the outcome"
      pinId={simulationName ? `sim-tornado-${simulationName}` : undefined}
      loading={loading}
    >
      <div style={{ height: 300 }}>
        <ResponsiveBar
          data={chartData}
          keys={["low", "high"]}
          indexBy="factor"
          layout="horizontal"
          margin={{ top: 10, right: 30, bottom: 40, left: 140 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          colors={["#ef4444", "#22c55e"]}
          borderRadius={3}
          axisBottom={{
            format: (v) =>
              typeof v === "number" && Math.abs(v) >= 1000
                ? `$${(v / 1000).toFixed(0)}K`
                : `$${v}`,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
          }}
          enableLabel={false}
          enableGridX
          enableGridY={false}
          theme={{
            text: { fill: "var(--foreground)" },
            axis: {
              ticks: {
                text: {
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                },
              },
            },
            grid: {
              line: { stroke: "var(--border)", strokeWidth: 1 },
            },
            tooltip: {
              container: {
                background: "var(--card)",
                color: "var(--foreground)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: 12,
              },
            },
          }}
        />
      </div>
    </ResultCard>
  );
};
