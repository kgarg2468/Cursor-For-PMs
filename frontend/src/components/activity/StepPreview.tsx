import { Badge } from "@/components/ui/badge";
import type { ActivityStep } from "@/types/activityFeed";

interface StepPreviewProps {
  previewType: ActivityStep["previewType"];
  previewData: Record<string, unknown>;
}

export const StepPreview = ({ previewType, previewData }: StepPreviewProps) => {
  if (!previewType) return null;

  switch (previewType) {
    case "scenarios-list": {
      const scenarios = (previewData.scenarios as Array<{ id: string; name: string }>) ?? [];
      return (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scenarios.map((s) => (
            <Badge
              key={s.id}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {s.name}
            </Badge>
          ))}
        </div>
      );
    }

    case "scenario-metric": {
      const value = previewData.value as string | number | undefined;
      const label = previewData.label as string | undefined;
      if (!value) return null;
      return (
        <div className="mt-2 flex items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">{label ?? "VaR"}</span>
          <span className="font-medium text-primary">{value}</span>
        </div>
      );
    }

    case "insight-card": {
      const count = previewData.count as number;
      const latestTitle = previewData.latestTitle as string;
      const latestType = previewData.latestType as string;
      return (
        <div className="mt-2 rounded border border-border/50 bg-muted/20 px-2.5 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {count} insight{count !== 1 ? "s" : ""} generated
            </span>
            {latestType && (
              <Badge variant="outline" className="text-[9px] h-4">
                {latestType}
              </Badge>
            )}
          </div>
          {latestTitle && (
            <p className="text-[11px] text-foreground/80 mt-0.5 truncate">
              {latestTitle}
            </p>
          )}
        </div>
      );
    }

    case "kpi-summary": {
      const entries = Object.entries(previewData).slice(0, 4);
      if (entries.length === 0) return null;
      return (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="rounded bg-muted/20 border border-border/30 px-2 py-1"
            >
              <p className="text-[9px] text-muted-foreground capitalize">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-[11px] font-medium text-foreground/80">
                {String(val)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
};
