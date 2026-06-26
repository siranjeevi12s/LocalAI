import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("LocalMind UI error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-soft">
          <p className="text-sm font-semibold text-destructive">
            Something went wrong.
          </p>
          <h1 className="mt-2 text-2xl font-semibold">LocalMind needs a reset</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </section>
      </main>
    );
  }
}
