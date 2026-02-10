import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router-dom";

export const SimulationsPage = () => {
  const activeDataset = useAppStore((s) => s.activeDataset);
  const navigate = useNavigate();

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Market Simulations
          </h1>
          <p className="text-muted-foreground max-w-md">
            Run "what if" simulations to estimate the impact of building new
            features. Upload data first to get started.
          </p>
        </div>
        <Button onClick={() => navigate("/data")}>Upload Data First</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Market Simulations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore "what if" scenarios using Monte Carlo simulation
          </p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          New Simulation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">
                What if we build...
              </label>
              <input
                type="text"
                placeholder='e.g., "SSO/SAML authentication for enterprise"'
                className="w-full bg-secondary rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <Button>
              <FlaskConical className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
