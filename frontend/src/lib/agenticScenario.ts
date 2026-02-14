import type { Node, Edge } from "@xyflow/react";
import type { SimTemplate, SimNodeData, ParamDef } from "@/types/simulation";

/** Raw agentic scenario as returned by the API (node_structure, edge_structure, node_params) */
export interface AgenticScenarioRaw {
  id: string;
  name: string;
  description?: string;
  template_type?: string;
  rationale?: string;
  node_structure: Array<{
    id: string;
    type: "source" | "modifier" | "sink";
    position: { x: number; y: number };
    data: {
      label: string;
      subtitle?: string;
      icon?: string;
      params?: Array<{
        key: string;
        label: string;
        type: ParamDef["type"];
        default: number;
        min: number;
        max: number;
        step: number;
      }>;
    };
  }>;
  edge_structure: Array<{ id?: string; source: string; target: string }>;
  node_params: Record<string, Record<string, number>>;
}

/** Convert one agentic scenario (from API) into a SimTemplate for graph + NodeInspector. */
export function scenarioToSimTemplate(scenario: AgenticScenarioRaw): SimTemplate {
  const nodes: Node<SimNodeData>[] = (scenario.node_structure ?? []).map(
    (n) => ({
      id: n.id,
      type: n.type,
      position: n.position ?? { x: 0, y: 0 },
      data: {
        label: n.data?.label ?? n.id,
        subtitle: n.data?.subtitle ?? "",
        icon: n.data?.icon ?? "Activity",
        params: Array.isArray(n.data?.params) ? n.data.params : [],
      },
    })
  );

  const edges: Edge[] = (scenario.edge_structure ?? []).map((e, i) => ({
    id: e.id ?? `e${i + 1}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));

  return {
    id: scenario.id,
    name: scenario.name,
    subtitle: scenario.description ?? "",
    description: scenario.description ?? scenario.rationale ?? "",
    icon: "Activity",
    nodes,
    edges,
  };
}

/** Build initial node param values from a scenario (for store). */
export function scenarioToNodeParams(
  scenario: AgenticScenarioRaw
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const raw = scenario.node_params ?? {};
  for (const node of scenario.node_structure ?? []) {
    const nodeId = node.id;
    const paramDefs = node.data?.params;
    if (Array.isArray(paramDefs) && paramDefs.length > 0) {
      out[nodeId] = {};
      for (const p of paramDefs) {
        const key = p.key;
        const fromRaw = raw[nodeId]?.[key];
        out[nodeId][key] =
          typeof fromRaw === "number" ? fromRaw : p.default;
      }
    } else if (raw[nodeId]) {
      out[nodeId] = { ...raw[nodeId] };
    }
  }
  return out;
}
