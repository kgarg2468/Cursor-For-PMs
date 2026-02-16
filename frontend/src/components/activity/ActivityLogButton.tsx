import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogDrawer } from "./ActivityLogDrawer";

export const ActivityLogButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shadow-md bg-card"
          onClick={() => setOpen(true)}
        >
          <ListChecks className="h-3.5 w-3.5" />
          View activity log
        </Button>
      </div>

      <ActivityLogDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};
