import type {
  HealthStatus,
  OllamaModel,
  VersionInfo,
} from "@/types/ollama";
import type { StreamChatRequest, StreamEvent } from "@/types/chat";

const fallbackApiBaseUrl = "http://127.0.0.1:3217";

export function getApiBaseUrl() {
  return (
    window.localMind?.apiBaseUrl ||
    import.meta.env.VITE_API_BASE_URL ||
    fallbackApiBaseUrl
  );
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    let message = fallback;

    try {
      const body = (await response.json()) as { message?: string };
      message = body.message || fallback;
    } catch {
      message = fallback;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  health: () => request<HealthStatus>("/health"),
  version: () => request<VersionInfo>("/version"),
  models: () => request<{ models: OllamaModel[] }>("/models"),
};

export async function streamChat(
  payload: StreamChatRequest,
  callbacks: {
    signal?: AbortSignal;
    onToken: (token: string) => void;
    onDone?: (stats?: Record<string, unknown>) => void;
    onError?: (message: string) => void;
  }
) {
  const response = await fetch(`${getApiBaseUrl()}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: callbacks.signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Streaming failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const line = event
        .split("\n")
        .find((part) => part.startsWith("data:"));

      if (!line) continue;

      const parsed = JSON.parse(line.slice(5).trim()) as StreamEvent;

      if (parsed.type === "token") callbacks.onToken(parsed.content);
      if (parsed.type === "done") callbacks.onDone?.(parsed.stats);
      if (parsed.type === "error") callbacks.onError?.(parsed.message);
    }
  }
}
