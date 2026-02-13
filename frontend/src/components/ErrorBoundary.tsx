import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-full w-full bg-background flex flex-col items-center justify-center gap-4 p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {this.props.fallbackMessage ??
              "An error occurred while loading this view."}
          </p>
          <Button variant="outline" asChild>
            <Link to="/simulations">Back to Simulations</Link>
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
