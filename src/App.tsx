import { lazy, Suspense, useState } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/layouts/AppLayout";
import { useTheme } from "@/hooks/useTheme";
import { useOllama } from "@/hooks/useOllama";
import { TooltipProvider } from "@/components/ui/tooltip";

const SettingsDialog = lazy(() =>
  import("@/components/settings/SettingsDialog").then((module) => ({
    default: module.SettingsDialog,
  }))
);

export function App() {
  useTheme();
  const ollama = useOllama();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AppLayout
          models={ollama.models}
          health={ollama.health}
          isLoadingModels={ollama.isLoading}
          onRefreshModels={ollama.refresh}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Suspense fallback={null}>
          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            models={ollama.models}
            health={ollama.health}
            onRefreshModels={ollama.refresh}
          />
        </Suspense>
        <Toaster richColors closeButton position="top-right" />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
