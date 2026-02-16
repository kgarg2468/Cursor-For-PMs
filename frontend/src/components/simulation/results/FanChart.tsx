import { ResponsiveLine } from "@nivo/line";
import type { FanChartData } from "@/types/simulation";
import { ResultCard } from "./ResultCard";

interface FanChartProps {
  data: FanChartData | null;
  loading?: boolean;
  simulationName?: string;
}

export const FanChart = ({ data, loading, simulationName }: FanChartProps) => {
  if (!data && !loading) return null;

  const series = Array.isArray(data?.series) ? data.series : [];
  const chartData = series.map((s) => ({
    id: s?.label ?? "",
    data: Array.isArray(s?.data)
      ? s.data
          .filter((d) => d != null && d.x != null && d.x !== "")
          .map((d) => ({
            x: String(d.x),
            y: Number(d?.y ?? 0),
          }))
      : [],
  }));

  return (
    <ResultCard
      title={data?.title ?? "Revenue Projection"}
      subtitle="12-month fan chart with P10/P50/P90 bands"
      pinId={simulationName ? `sim-fan-${simulationName}` : undefined}
      loading={loading}
    >
      <div style={{ height: 400 }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 120, bottom: 50, left: 80 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          axisBottom={{
            legend: data?.x_label ?? "Month",
            legendOffset: 40,
            legendPosition: "middle",
          }}
          axisLeft={{
            legend: data?.y_label ?? "Revenue ($)",
            legendOffset: -65,
            legendPosition: "middle",
            format: (v) =>
              typeof v === "number" && Math.abs(v) >= 1000
                ? `$${(v / 1000).toFixed(0)}K`
                : `$${v}`,
          }}
          colors={["#ef4444", "var(--primary)", "#22c55e", "#6b7280"]}
          lineWidth={2}
          pointSize={0}
          enableArea={false}
          enableSlices="x"
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 110,
              itemWidth: 100,
              itemHeight: 20,
              itemTextColor: "var(--muted-foreground)",
              symbolSize: 10,
              symbolShape: "circle",
            },
          ]}
          theme={{
            text: { fill: "var(--foreground)" },
            axis: {
              ticks: { text: { fill: "var(--muted-foreground)", fontSize: 11 } },
              legend: { text: { fill: "var(--muted-foreground)", fontSize: 12 } },
            },
            grid: { line: { stroke: "var(--border)", strokeWidth: 1 } },
            crosshair: { line: { stroke: "var(--muted-foreground)", strokeWidth: 1 } },
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
