import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";

interface ChartData {
  type: "bar" | "line";
  labels: string[];
  values: number[];
}

interface MiniChartProps {
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

export const MiniChart = ({ chartData, color = "blue" }: MiniChartProps) => {
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

    return (
      <div style={{ width: 160, height: 64 }}>
        <ResponsiveBar
          data={barData}
          keys={["value"]}
          indexBy="id"
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          padding={0.3}
          colors={[chartColor]}
          enableGridY={false}
          enableLabel={false}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          axisLeft={null}
          isInteractive={false}
          animate={false}
          borderRadius={2}
        />
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
    <div style={{ width: 160, height: 64 }}>
      <ResponsiveLine
        data={lineData}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        colors={[chartColor]}
        enableGridX={false}
        enableGridY={false}
        enablePoints={false}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={null}
        isInteractive={false}
        animate={false}
        curve="monotoneX"
        lineWidth={2}
        enableArea={true}
        areaOpacity={0.15}
      />
    </div>
  );
};
