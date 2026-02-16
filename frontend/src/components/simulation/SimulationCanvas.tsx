import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSimulationStore } from "@/stores/simulationStore";
import { SourceNode } from "./nodes/SourceNode";
import { ModifierNode } from "./nodes/ModifierNode";
import { SinkNode } from "./nodes/SinkNode";

const nodeTypes: NodeTypes = {
  source: SourceNode,
  modifier: ModifierNode,
  sink: SinkNode,
};

const defaultEdgeOptions = {
  style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
  animated: true,
};

const FitViewHelper = ({ templateId }: { templateId: string }) => {
  const { fitView } = useReactFlow();
  const prevId = useRef(templateId);

  useEffect(() => {
    if (prevId.current !== templateId) {
      prevId.current = templateId;
    }
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 600);
    return () => clearTimeout(timer);
  }, [templateId, fitView]);

  return null;
};

export const SimulationCanvas = () => {
  const selectedTemplate = useSimulationStore((s) => s.selectedTemplate);
  const [visibleNodeCount, setVisibleNodeCount] = useState(0);
  const [showEdges, setShowEdges] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated build-up: nodes appear one at a time
  useEffect(() => {
    if (!selectedTemplate) return;

    setVisibleNodeCount(0);
    setShowEdges(false);

    // Clear any previous timer
    if (animTimerRef.current) clearInterval(animTimerRef.current);

    let count = 0;
    const total = selectedTemplate.nodes.length;

    animTimerRef.current = setInterval(() => {
      count++;
      setVisibleNodeCount(count);

      if (count >= total) {
        if (animTimerRef.current) clearInterval(animTimerRef.current);
        animTimerRef.current = null;
        // Show edges after all nodes are visible
        setTimeout(() => setShowEdges(true), 150);
      }
    }, 200);

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [selectedTemplate]);

  const visibleNodes: Node[] = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.nodes.slice(0, visibleNodeCount);
  }, [selectedTemplate, visibleNodeCount]);

  const visibleEdges: Edge[] = useMemo(() => {
    if (!selectedTemplate || !showEdges) return [];
    const nodeIds = new Set(visibleNodes.map((n) => n.id));
    return selectedTemplate.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );
  }, [selectedTemplate, showEdges, visibleNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      useSimulationStore.getState().setInspectedNodeId(node.id);
    },
    [],
  );

  if (!selectedTemplate) return null;

  return (
    <div className="h-full w-full sim-canvas dot-grid">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.15)"
        />
        <FitViewHelper templateId={selectedTemplate.id} />
      </ReactFlow>
    </div>
  );
};
