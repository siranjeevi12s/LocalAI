import { useState } from "react";
import { Menu } from "lucide-react";
import { ChatPage } from "@/pages/ChatPage";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Button } from "@/components/ui/button";
import type { HealthStatus, OllamaModel } from "@/types/ollama";

interface AppLayoutProps {
  models: OllamaModel[];
  health?: HealthStatus;
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  onOpenSettings: () => void;
}

export function AppLayout({
  models,
  health,
  isLoadingModels,
  onRefreshModels,
  onOpenSettings,
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-surface flex h-full overflow-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        onOpenSettings={onOpenSettings}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/84 px-3 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open sidebar"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">LocalMind AI</p>
            <p className="truncate text-xs text-muted-foreground">
              {health?.ollama.running ? "Ollama connected" : "Ollama offline"}
            </p>
          </div>
        </header>

        <ChatPage
          models={models}
          health={health}
          isLoadingModels={isLoadingModels}
          onRefreshModels={onRefreshModels}
        />
      </div>
    </div>
  );
}
