import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InsightResponse } from "@/lib/api";

interface AlertBannerProps {
  insights: InsightResponse[];
}

export const AlertBanner = ({ insights }: AlertBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  const criticalAlert = insights.find(
    (i) => i.type === "alert" && i.priority === "critical"
  );

  if (!criticalAlert || dismissed) return null;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-400">
          {criticalAlert.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {criticalAlert.description}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
