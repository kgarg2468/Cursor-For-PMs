import type { Node, Edge } from "@xyflow/react";

/** Parameter definition within a template node */
export interface ParamDef {
  key: string;
  label: string;
  type: "currency" | "percentage" | "slider" | "number" | "months";
  default: number;
  min: number;
  max: number;
  step: number;
}

/** Data payload for a simulation node */
export interface SimNodeData {
  label: string;
  subtitle: string;
  icon: string;
  params: ParamDef[];
  [key: string]: unknown;
}

/** Full template definition */
export interface SimTemplate {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  nodes: Node<SimNodeData>[];
  edges: Edge[];
}

/** Runtime param values: nodeId → paramKey → value */
export type NodeParamValues = Record<string, Record<string, number>>;

/** Fan chart data from Claude */
export interface FanChartData {
  title: string;
  x_label: string;
  y_label: string;
  series: {
    id: string;
    label: string;
    data: { x: string; y: number }[];
  }[];
}

/** Tornado chart data from Claude */
export interface TornadoChartData {
  title: string;
  factors: {
    factor: string;
    low: number;
    high: number;
    base: number;
  }[];
}

/** Histogram data from Claude */
export interface HistogramData {
  title: string;
  x_label: string;
  buckets: {
    range: string;
    count: number;
  }[];
  percentiles: {
    p5: number;
    p50: number;
    p95: number;
  };
}

/** Scenario table data from Claude */
export interface ScenarioTableData {
  title: string;
  scenarios: {
    name: string;
    revenue_impact: number;
    customer_impact: number;
    timeline: string;
    probability: number;
    key_assumption: string;
  }[];
  recommendation: "best" | "base" | "worst";
}

/** Value at Risk card data from Claude */
export interface VaRCardData {
  title: string;
  var_amount: number;
  var_description: string;
  confidence_level: number;
  expected_value: number;
  best_case: number;
  recommendation: string;
}

/** All simulation results bundled */
export interface SimulationResults {
  fanChart: FanChartData | null;
  tornadoChart: TornadoChartData | null;
  histogram: HistogramData | null;
  scenarioTable: ScenarioTableData | null;
  varCard: VaRCardData | null;
  summary: string | null;
}
