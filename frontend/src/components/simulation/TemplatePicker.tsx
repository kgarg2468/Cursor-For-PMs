import { Lock, Activity, Repeat } from "lucide-react";
import { SIMULATION_TEMPLATES } from "@/lib/simulationTemplates";
import { useSimulationStore } from "@/stores/simulationStore";
import { cn } from "@/lib/utils";
import type { SimTemplate } from "@/types/simulation";

const ICON_MAP: Record<string, React.ReactNode> = {
  Lock: <Lock className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Repeat: <Repeat className="h-5 w-5" />,
};

const TemplateCard = ({
  template,
  selected,
  onClick,
}: {
  template: SimTemplate;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-lg border p-3 transition-colors",
      selected
        ? "border-primary bg-primary/5"
        : "border-border bg-card hover:border-primary/30 hover:bg-accent",
    )}
  >
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          selected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        {ICON_MAP[template.icon] ?? <Activity className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{template.name}</div>
        <div className="text-[10px] text-primary/70 mb-1">{template.subtitle}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {template.description}
        </div>
      </div>
    </div>
  </button>
);

/** Sidebar template picker */
export const TemplatePicker = ({ compact }: { compact?: boolean }) => {
  const selectedTemplate = useSimulationStore((s) => s.selectedTemplate);
  const selectTemplate = useSimulationStore((s) => s.selectTemplate);

  if (compact) {
    return (
      <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Templates
          </h2>
          <div className="space-y-2">
            {SIMULATION_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={selectedTemplate?.id === t.id}
                onClick={() => selectTemplate(t)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full-page centered picker
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Market Simulations
        </h1>
        <p className="text-muted-foreground max-w-lg">
          Choose a simulation template to model strategic decisions. Each
          template is a causal graph that Claude reasons through numerically.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {SIMULATION_TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={false}
            onClick={() => selectTemplate(t)}
          />
        ))}
      </div>
    </div>
  );
};
