import { ResponsiveBar } from "@nivo/bar";
import type { HistogramData } from "@/types/simulation";
import { ResultCard } from "./ResultCard";

interface HistogramChartProps {
  data: HistogramData | null;
  loading?: boolean;
  simulationName?: string;
}

export const HistogramChart = ({
  data,
  loading,
  simulationName,
}: HistogramChartProps) => {
  if (!data && !loading) return null;

  const chartData =
    data?.buckets.map((b) => ({
      range: b.range,
      count: b.count,
    })) ?? [];

  const formatDollar = (v: number) =>
    Math.abs(v) >= 1000000
      ? `$${(v / 1000000).toFixed(1)}M`
      : Math.abs(v) >= 1000
        ? `$${(v / 1000).toFixed(0)}K`
        : `$${v}`;

  return (
    <ResultCard
      title={data?.title ?? "Outcome Distribution"}
      subtitle={
        data?.percentiles
          ? `P5: ${formatDollar(data.percentiles.p5)} · P50: ${formatDollar(data.percentiles.p50)} · P95: ${formatDollar(data.percentiles.p95)}`
          : "Distribution of simulated outcomes"
      }
      pinId={simulationName ? `sim-histogram-${simulationName}` : undefined}
      loading={loading}
    >
      <div style={{ height: 300 }}>
        <ResponsiveBar
          data={chartData}
          keys={["count"]}
          indexBy="range"
          margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
          padding={0.15}
          colors={["hsl(var(--primary))"]}
          borderRadius={3}
          axisBottom={{
            tickRotation: -35,
          }}
          axisLeft={{
            legend: "Frequency",
            legendOffset: -40,
            legendPosition: "middle",
          }}
          enableLabel={false}
          enableGridY
          enableGridX={false}
          theme={{
            text: { fill: "hsl(var(--foreground))" },
            axis: {
              ticks: {
                text: {
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                },
              },
              legend: {
                text: {
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                },
              },
            },
            grid: {
              line: { stroke: "hsl(var(--border))", strokeWidth: 1 },
            },
            tooltip: {
              container: {
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              },
            },
          }}
        />
      </div>
    </ResultCard>
  );
};
