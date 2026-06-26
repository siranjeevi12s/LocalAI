import { motion } from "framer-motion";
import { Bot, Cpu, RefreshCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HealthStatus, OllamaModel } from "@/types/ollama";

interface WelcomeScreenProps {
  models: OllamaModel[];
  health?: HealthStatus;
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  onPromptSelect: (prompt: string) => void;
}

const prompts = [
  "Summarize this TypeScript module and suggest improvements.",
  "Create a study plan for machine learning fundamentals.",
  "Explain this algorithm with a small example in Python.",
  "Draft research notes comparing two local LLMs.",
];

export function WelcomeScreen({
  models,
  health,
  isLoadingModels,
  onRefreshModels,
  onPromptSelect,
}: WelcomeScreenProps) {
  const ollamaOnline = Boolean(health?.ollama.running);
  const hasModels = models.length > 0;

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4 md:p-8">
      <motion.section
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <Bot className="h-8 w-8" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
            LocalMind AI
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
            A fast local workspace for private prompts, code, notes, and
            research.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Offline-first</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Conversations stay on this computer.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Cpu className="mb-3 h-5 w-5 text-accent" />
            <p className="text-sm font-medium">Ollama backend</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {ollamaOnline ? "Runtime detected." : "Runtime not detected."}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Bot className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Installed models</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isLoadingModels ? "Checking models..." : `${models.length} found`}
            </p>
          </div>
        </div>

        {(!ollamaOnline || !hasModels) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-lg border bg-card p-4 text-sm">
            <Badge variant={ollamaOnline ? "warning" : "destructive"}>
              {ollamaOnline ? "No models installed" : "Ollama offline"}
            </Badge>
            <span className="text-muted-foreground">
              {health?.message ||
                (ollamaOnline
                  ? "Install a model with Ollama to begin."
                  : "Start Ollama and refresh the model list.")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshModels}
              disabled={isLoadingModels}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-lg border bg-card p-4 text-left text-sm leading-6 shadow-sm transition hover:border-primary/60 hover:bg-secondary"
              onClick={() => onPromptSelect(prompt)}
              disabled={!hasModels}
            >
              {prompt}
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
