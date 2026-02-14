import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSimulationStore } from "@/stores/simulationStore";
import { simulationsApi } from "@/lib/api";
import type { ParamDef, SimNodeData } from "@/types/simulation";
import { cn } from "@/lib/utils";

const ParamInput = ({
  param,
  value,
  onChange,
}: {
  param: ParamDef;
  value: number;
  onChange: (v: number) => void;
}) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(v);
  };

  switch (param.type) {
    case "currency":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{param.label}</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              value={value}
              onChange={handleNumberChange}
              min={param.min}
              max={param.max}
              step={param.step}
              className="w-full bg-secondary rounded-md pl-6 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      );

    case "percentage":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {param.label}
            </Label>
            <span className="text-xs font-medium">{value}%</span>
          </div>
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-full"
          />
        </div>
      );

    case "slider":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {param.label}
            </Label>
            <span className="text-xs font-medium">{value}</span>
          </div>
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-full"
          />
        </div>
      );

    case "months":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{param.label}</Label>
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={handleNumberChange}
              min={param.min}
              max={param.max}
              step={param.step}
              className="w-full bg-secondary rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring pr-10"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              mo
            </span>
          </div>
        </div>
      );

    case "number":
    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{param.label}</Label>
          <input
            type="number"
            value={value}
            onChange={handleNumberChange}
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-full bg-secondary rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      );
  }
};

const TalkToClaudeSection = ({
  nodeId,
  nodeLabel,
  nodeType,
}: {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
}) => {
  const nodeContext = useSimulationStore((s) => s.nodeContext);
  const scope = useSimulationStore((s) =>
    s.agenticMode && s.selectedScenario ? s.selectedScenario : s.selectedTemplate?.id ?? "template"
  );
  const setNodeContext = useSimulationStore((s) => s.setNodeContext);
  const ctx = nodeContext[`${scope}:${nodeId}`];
  const [draft, setDraft] = useState(ctx?.userMessage ?? "");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const msg = draft.trim();
    if (!msg || loading) return;
    setLoading(true);
    try {
      const { reply } = await simulationsApi.postNodeContext({
        node_label: nodeLabel,
        node_type: nodeType,
        user_message: msg,
      });
      setNodeContext(nodeId, { userMessage: msg, claudeReply: reply });
    } catch {
      setNodeContext(nodeId, { userMessage: msg, claudeReply: "Failed to get response." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <Label className="text-xs text-muted-foreground">Talk to Claude — add details</Label>
      <Textarea
        placeholder="e.g. Assume 60% of enterprise accounts need SSO; churn risk is higher for this segment."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-h-[72px] text-xs resize-none bg-secondary"
        maxLength={2000}
      />
      <Button
        size="sm"
        className="w-full"
        onClick={handleSend}
        disabled={!draft.trim() || loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
      </Button>
      {ctx?.claudeReply && (
        <div className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
          {ctx.claudeReply}
        </div>
      )}
    </div>
  );
};

export const NodeInspector = () => {
  const inspectedNodeId = useSimulationStore((s) => s.inspectedNodeId);
  const selectedTemplate = useSimulationStore((s) => s.selectedTemplate);
  const nodeParams = useSimulationStore((s) => s.nodeParams);
  const setNodeParam = useSimulationStore((s) => s.setNodeParam);
  const setInspectedNodeId = useSimulationStore((s) => s.setInspectedNodeId);

  if (!inspectedNodeId || !selectedTemplate) return null;

  const node = selectedTemplate.nodes.find((n) => n.id === inspectedNodeId);
  if (!node) return null;

  const nodeData = node.data as SimNodeData;
  const params = nodeData.params;

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-medium">{nodeData.label}</h3>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full",
            node.type === "source" && "bg-emerald-500/15 text-emerald-400",
            node.type === "modifier" && "bg-amber-500/15 text-amber-400",
            node.type === "sink" && "bg-blue-500/15 text-blue-400",
          )}
        >
          {node.type}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => setInspectedNodeId(null)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  if (params.length === 0) {
    return (
      <div className="w-[280px] shrink-0 border-l border-border bg-card overflow-y-auto">
        <div className="p-4">
          {header}
          <p className="text-xs text-muted-foreground mb-2">
            This is an output node — no parameters to configure.
          </p>
          <TalkToClaudeSection
            key={inspectedNodeId}
            nodeId={inspectedNodeId}
            nodeLabel={nodeData.label}
            nodeType={node.type}
          />
        </div>
      </div>
    );
  }

  const currentParams = nodeParams[inspectedNodeId] ?? {};

  return (
    <div className="w-[280px] shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4">
        {header}

        <div className="space-y-4">
          {params.map((param) => (
            <ParamInput
              key={param.key}
              param={param}
              value={currentParams[param.key] ?? param.default}
              onChange={(v) => setNodeParam(inspectedNodeId, param.key, v)}
            />
          ))}
        </div>

        <TalkToClaudeSection
          key={inspectedNodeId}
          nodeId={inspectedNodeId}
          nodeLabel={nodeData.label}
          nodeType={node.type}
        />
      </div>
    </div>
  );
};
