import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const placeholderKPIs = [
  {
    label: "Monthly Recurring Revenue",
    value: "$142,850",
    change: "+12.3%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    label: "Active Users",
    value: "1,247",
    change: "+5.8%",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Churn Rate",
    value: "4.2%",
    change: "+0.8%",
    trend: "down" as const,
    icon: Activity,
  },
  {
    label: "Net Revenue Retention",
    value: "108%",
    change: "+2.1%",
    trend: "up" as const,
    icon: TrendingUp,
  },
];

export const DashboardPage = () => {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const navigate = useNavigate();

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Insight Autopilot
          </h1>
          <p className="text-muted-foreground max-w-md">
            Upload your product data or try with our sample dataset. AI will
            automatically analyze it and surface actionable insights.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/data")} size="lg">
            Upload Data
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/data")}
          >
            Try Sample Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderKPIs.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    kpi.trend === "up" && kpi.label !== "Churn Rate"
                      ? "text-xs text-emerald-500"
                      : "text-xs text-red-500"
                  }
                >
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-analyzed
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  Alert
                </Badge>
                <span className="text-xs text-muted-foreground">
                  High Priority
                </span>
              </div>
              <CardTitle className="text-sm mt-2">
                Enterprise Churn Spike Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                23% of enterprise accounts requesting SSO/SAML have churned in
                the last 90 days. This correlates strongly with missing
                enterprise features.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  -$34K MRR impact
                </Badge>
                <Badge variant="outline" className="text-xs">
                  87% confidence
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  Opportunity
                </Badge>
                <span className="text-xs text-muted-foreground">
                  High Priority
                </span>
              </div>
              <CardTitle className="text-sm mt-2">
                Free→Pro Conversion Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Free-to-Pro conversion rate dropped 18% after the pricing page
                redesign. A/B test data suggests the new layout is confusing
                users.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  +$12K potential
                </Badge>
                <Badge variant="outline" className="text-xs">
                  79% confidence
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                  Trend
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Medium Priority
                </span>
              </div>
              <CardTitle className="text-sm mt-2">
                API Usage Anomaly in EU Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                EU region API calls have increased 340% in 30 days. This is
                driven by 3 accounts with unusual usage patterns.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  12 accounts
                </Badge>
                <Badge variant="outline" className="text-xs">
                  92% confidence
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
