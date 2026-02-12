import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SimNodeData } from "@/types/simulation";
import { useSimulationStore } from "@/stores/simulationStore";

export const SourceNode = ({ id, data }: NodeProps) => {
  const nodeData = data as unknown as SimNodeData;
  const setInspectedNodeId = useSimulationStore((s) => s.setInspectedNodeId);
  const paramCount = nodeData.params?.length ?? 0;

  return (
    <div
      className="sim-node-enter bg-card border border-border rounded-lg shadow-sm w-[200px] cursor-pointer hover:border-emerald-500/50 transition-colors border-l-4 border-l-emerald-500"
      onClick={() => setInspectedNodeId(id)}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{nodeData.label}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {nodeData.subtitle}
            </div>
          </div>
          {paramCount > 0 && (
            <span className="shrink-0 text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">
              {paramCount}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-emerald-500 !border-emerald-600"
      />
    </div>
  );
};
