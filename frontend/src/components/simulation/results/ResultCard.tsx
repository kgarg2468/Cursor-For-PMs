import { Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";
import { useAppStore } from "@/stores/appStore";

interface ResultCardProps {
  title: string;
  subtitle?: string;
  pinId?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ResultCard = ({
  title,
  subtitle,
  pinId,
  loading,
  children,
  className,
}: ResultCardProps) => {
  const pinCard = useChatStore((s) => s.pinCard);
  const setSidePanelOpen = useAppStore((s) => s.setSidePanelOpen);

  const handlePin = () => {
    if (!pinId) return;
    pinCard(pinId);
    setSidePanelOpen(true);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {pinId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePin}
              title="Pin to chat"
            >
              <Pin className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};
