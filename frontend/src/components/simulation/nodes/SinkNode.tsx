import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SimNodeData } from "@/types/simulation";
import { useSimulationStore } from "@/stores/simulationStore";

export const SinkNode = ({ id, data }: NodeProps) => {
  const nodeData = data as unknown as SimNodeData;
  const setInspectedNodeId = useSimulationStore((s) => s.setInspectedNodeId);

  return (
    <div
      className="sim-node-enter bg-card/60 backdrop-blur-xl border border-white/[0.06] rounded-lg shadow-sm w-[200px] cursor-pointer hover:border-blue-500/50 transition-colors border-l-4 border-l-blue-500 shadow-[-2px_0_8px_rgba(59,130,246,0.2)]"
      onClick={() => setInspectedNodeId(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-500 !border-blue-600"
      />
      <div className="px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{nodeData.label}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {nodeData.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};
