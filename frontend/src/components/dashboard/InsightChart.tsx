import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";

interface ChartData {
  type: "bar" | "line";
  labels: string[];
  values: number[];
}

interface InsightChartProps {
  chartData: ChartData | null | undefined;
  color?: string;
}

const TYPE_COLORS: Record<string, string> = {
  amber: "#f59e0b",
  emerald: "#10b981",
  blue: "#3b82f6",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  orange: "#f97316",
};

const tooltipTheme = {
  tooltip: {
    container: {
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
      color: "var(--color-foreground)",
      fontSize: "12px",
      borderRadius: "6px",
      padding: "6px 10px",
    },
  },
};

export const InsightChart = ({ chartData, color = "blue" }: InsightChartProps) => {
  if (
    !chartData ||
    !chartData.type ||
    !Array.isArray(chartData.labels) ||
    !Array.isArray(chartData.values) ||
    chartData.labels.length === 0
  ) {
    return null;
  }

  const chartColor = TYPE_COLORS[color] || TYPE_COLORS.blue;

  if (chartData.type === "bar") {
    const barData = chartData.labels.map((label, i) => ({
      id: label,
      value: chartData.values[i] ?? 0,
    }));

    const height = Math.max(120, barData.length * 30);

    return (
      <div className="bg-muted/30 rounded-lg p-2">
        <div style={{ width: "100%", height }}>
          <ResponsiveBar
            data={barData}
            keys={["value"]}
            indexBy="id"
            margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
            padding={0.35}
            colors={[chartColor]}
            enableGridY={false}
            enableLabel={false}
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={null}
            isInteractive={true}
            animate={true}
            borderRadius={3}
            theme={tooltipTheme}
          />
        </div>
      </div>
    );
  }

  // Line chart
  const lineData = [
    {
      id: "series",
      data: chartData.labels.map((label, i) => ({
        x: label,
        y: chartData.values[i] ?? 0,
      })),
    },
  ];

  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveLine
          data={lineData}
          margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
          colors={[chartColor]}
          enableGridX={false}
          enableGridY={false}
          enablePoints={true}
          pointSize={6}
          pointColor={chartColor}
          pointBorderWidth={0}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          axisLeft={null}
          isInteractive={true}
          animate={true}
          curve="monotoneX"
          lineWidth={2}
          enableArea={true}
          areaOpacity={0.1}
          useMesh={true}
          theme={tooltipTheme}
        />
      </div>
    </div>
  );
};
