import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { HealthStatus, OllamaModel } from "@/types/ollama";

function normalizeModelName(name: string) {
  return name.replace(/:latest$/, "");
}

function resolveModelSelection(
  models: OllamaModel[],
  selectedModel: string,
  defaultModel: string
) {
  const preferredModels = [selectedModel, defaultModel].filter(Boolean);

  for (const preferred of preferredModels) {
    const exactMatch = models.find((model) => model.name === preferred);
    if (exactMatch) return exactMatch.name;

    const normalizedPreferred = normalizeModelName(preferred);
    const normalizedMatch = models.find(
      (model) => normalizeModelName(model.name) === normalizedPreferred
    );
    if (normalizedMatch) return normalizedMatch.name;
  }

  return models[0]?.name ?? "";
}

export function useOllama() {
  const selectedModel = useAppStore((state) => state.settings.selectedModel);
  const defaultModel = useAppStore((state) => state.settings.defaultModel);
  const setSettings = useAppStore((state) => state.setSettings);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [health, setHealth] = useState<HealthStatus>();
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const [healthResult, modelResult] = await Promise.all([
        api.health(),
        api.models(),
      ]);

      setHealth(healthResult);
      setModels(modelResult.models);

      if (!healthResult.ollama.running) {
        toast.error("Ollama is not running", {
          description: "Start Ollama locally, then refresh models.",
        });
      }

      const resolvedModel = resolveModelSelection(
        modelResult.models,
        selectedModel,
        defaultModel
      );

      if (resolvedModel && (selectedModel !== resolvedModel || defaultModel !== resolvedModel)) {
        setSettings({
          selectedModel: resolvedModel,
          defaultModel: resolvedModel,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the LocalMind API.";

      setHealth({
        ok: false,
        app: { name: "LocalMind AI", version: "0.1.0" },
        ollama: { running: false, modelCount: 0 },
        message,
      });
      toast.error("Unable to reach LocalMind API", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [defaultModel, selectedModel, setSettings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { models, health, isLoading, refresh };
}
