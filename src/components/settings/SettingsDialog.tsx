import { useRef } from "react";
import { Download, Info, RefreshCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import type { HealthStatus, OllamaModel } from "@/types/ollama";
import type { ExportedLocalMindData, ThemeMode } from "@/types/settings";
import { downloadJson, readJsonFile } from "@/utils/download";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: OllamaModel[];
  health?: HealthStatus;
  onRefreshModels: () => void;
}

const themes: { label: string; value: ThemeMode }[] = [
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
  { label: "Light", value: "light" },
];

export function SettingsDialog({
  open,
  onOpenChange,
  models,
  health,
  onRefreshModels,
}: SettingsDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const clearConversations = useAppStore((state) => state.clearConversations);
  const exportData = useAppStore((state) => state.exportData);
  const importData = useAppStore((state) => state.importData);

  function handleExport() {
    downloadJson(
      `localmind-export-${new Date().toISOString().slice(0, 10)}.json`,
      exportData()
    );
    toast.success("Conversations exported");
  }

  async function handleImport(file?: File) {
    if (!file) return;

    try {
      const data = await readJsonFile<ExportedLocalMindData>(file);
      if (data.version !== 1 || !Array.isArray(data.conversations)) {
        throw new Error("This file is not a LocalMind export.");
      }

      importData(data);
      toast.success("Conversations imported");
    } catch (error) {
      toast.error("Import failed", {
        description:
          error instanceof Error ? error.message : "Unable to import file.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClearAll() {
    if (window.confirm("Clear all LocalMind conversations?")) {
      clearConversations();
      toast.success("All conversations cleared");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure models, generation defaults, local data, and application
            details.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="min-h-0 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="generation">Generation</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="default-model">Default model</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Used for new conversations.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onRefreshModels}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <select
                id="default-model"
                value={settings.defaultModel}
                onChange={(event) =>
                  setSettings({
                    defaultModel: event.target.value,
                    selectedModel: event.target.value,
                  })
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                disabled={models.length === 0}
              >
                {models.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.displayName}
                    </option>
                  ))
                )}
              </select>
            </section>

            <section className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <Button
                    key={theme.value}
                    type="button"
                    variant={
                      settings.theme === theme.value ? "default" : "outline"
                    }
                    onClick={() => setSettings({ theme: theme.value })}
                  >
                    {theme.label}
                  </Button>
                ))}
              </div>
            </section>

            <section className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="auto-save">Auto Save Chats</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Persist conversations after restart.
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSaveChats}
                onCheckedChange={(checked) =>
                  setSettings({ autoSaveChats: checked })
                }
              />
            </section>
          </TabsContent>

          <TabsContent value="generation" className="space-y-6">
            <SettingSlider
              label="Temperature"
              value={settings.temperature}
              min={0}
              max={2}
              step={0.05}
              display={settings.temperature.toFixed(2)}
              onChange={(temperature) => setSettings({ temperature })}
            />
            <SettingSlider
              label="Top P"
              value={settings.topP}
              min={0.1}
              max={1}
              step={0.05}
              display={settings.topP.toFixed(2)}
              onChange={(topP) => setSettings({ topP })}
            />
            <SettingSlider
              label="Max Tokens"
              value={settings.maxTokens}
              min={128}
              max={8192}
              step={128}
              display={String(settings.maxTokens)}
              onChange={(maxTokens) => setSettings({ maxTokens })}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export Conversations
              </Button>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Import Conversations
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleImport(event.target.files?.[0])}
            />
            <Separator />
            <div className="rounded-lg border border-destructive/35 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-destructive">
                    Clear All Conversations
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Removes local chat history from this app.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="font-medium">Application Information</p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow label="Name" value="LocalMind AI" />
                <InfoRow label="Version" value="0.1.0" />
                <InfoRow label="Platform" value={window.localMind?.platform || "browser"} />
                <InfoRow
                  label="API"
                  value={window.localMind?.apiBaseUrl || "http://127.0.0.1:3217"}
                />
              </dl>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-3 font-medium">Ollama</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={health?.ollama.running ? "default" : "destructive"}>
                  {health?.ollama.running ? "Connected" : "Offline"}
                </Badge>
                <span className="text-muted-foreground">
                  {health?.ollama.version
                    ? `Version ${health.ollama.version}`
                    : "Version unavailable"}
                </span>
                <span className="text-muted-foreground">
                  {health?.ollama.modelCount ?? models.length} models
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface SettingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SettingSliderProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(nextValue) => onChange(nextValue[0] ?? value)}
      />
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}
