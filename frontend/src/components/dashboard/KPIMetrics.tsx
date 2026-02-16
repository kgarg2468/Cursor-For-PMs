import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Activity, Star } from "lucide-react";
import type { KPIs } from "@/stores/insightStore";

interface KPIMetricsProps {
  kpis: KPIs | null;
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

export const KPIMetrics = ({ kpis, isLoading }: KPIMetricsProps) => {
  const metrics = [
    {
      label: "Monthly Recurring Revenue",
      value: kpis?.total_mrr != null ? formatCurrency(kpis.total_mrr) : "—",
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      label: "Churn Rate",
      value: kpis?.churn_rate != null ? `${kpis.churn_rate}%` : "—",
      icon: Activity,
      color: (kpis?.churn_rate ?? 0) > 10 ? "text-red-500" : "text-amber-500",
    },
    {
      label: "Active Accounts",
      value: kpis?.active_accounts != null ? kpis.active_accounts.toLocaleString() : "—",
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Avg NPS Score",
      value: kpis?.avg_nps != null ? kpis.avg_nps.toFixed(1) : "—",
      icon: Star,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground tracking-tight">
              {metric.label}
            </CardTitle>
            <div className="h-7 w-7 rounded-md bg-white/[0.04] backdrop-blur-sm flex items-center justify-center">
              <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-4">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold font-data" style={{ textShadow: '0 0 20px oklch(0.78 0.15 200 / 0.15)' }}>{metric.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
