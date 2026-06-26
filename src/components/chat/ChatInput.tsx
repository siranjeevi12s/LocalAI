import { useEffect, useRef, useState } from "react";
import {
  CircleStop,
  Eraser,
  Paperclip,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import type { OllamaModel } from "@/types/ollama";
import { cn } from "@/utils/cn";

interface ChatInputProps {
  models: OllamaModel[];
  isStreaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
}

export function ChatInput({
  models,
  isStreaming,
  onSend,
  onStop,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const selectedModel = settings.selectedModel || settings.defaultModel;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    const prompt = value.trim();
    if (!prompt || isStreaming) return;

    onSend(prompt);
    setValue("");
  }

  return (
    <div className="shrink-0 border-t bg-background/86 p-3 backdrop-blur md:p-4">
      <div className="mx-auto max-w-4xl rounded-lg border bg-card p-2 shadow-soft">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Message LocalMind"
          rows={1}
          className="max-h-44 min-h-11 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-2 border-t px-1 pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sparkles className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            <select
              value={selectedModel}
              onChange={(event) =>
                setSettings({
                  selectedModel: event.target.value,
                  defaultModel: settings.defaultModel || event.target.value,
                })
              }
              className="h-9 min-w-0 max-w-[220px] rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Model selector"
              disabled={models.length === 0}
            >
              {models.length === 0 ? (
                <option value="">No models found</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.displayName}
                  </option>
                ))
              )}
            </select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attachments arrive after Version 1</TooltipContent>
            </Tooltip>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear textbox"
            onClick={() => setValue("")}
            disabled={!value}
          >
            <Eraser className="h-4 w-4" />
          </Button>

          {isStreaming ? (
            <Button variant="destructive" size="icon-sm" onClick={onStop} aria-label="Stop generation">
              <CircleStop className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              onClick={submit}
              disabled={!value.trim() || models.length === 0}
              aria-label="Send message"
              className={cn(!value.trim() && "opacity-60")}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
