import type { Express } from "express";
import { appConfig } from "../config";
import {
  chatComplete,
  getModels,
  getVersion,
  OllamaError,
  openChatStream,
  toOllamaHttpError,
  type ChatRequestMessage,
} from "../services/ollama";

function isChatMessage(value: unknown): value is ChatRequestMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    typeof message.content === "string" &&
    ["system", "user", "assistant"].includes(String(message.role))
  );
}

function parseChatBody(body: unknown) {
  const value = body as Record<string, unknown>;
  const model = value?.model;
  const messages = value?.messages;
  const options = (value?.options ?? {}) as Record<string, unknown>;

  if (typeof model !== "string" || !model.trim()) {
    throw new OllamaError("A valid model is required.", 400);
  }

  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    throw new OllamaError("Messages must be a valid chat message array.", 400);
  }

  return {
    model,
    messages,
    options: {
      temperature:
        typeof options.temperature === "number" ? options.temperature : 0.7,
      topP: typeof options.topP === "number" ? options.topP : 0.9,
      maxTokens:
        typeof options.maxTokens === "number" ? options.maxTokens : 2048,
    },
  };
}

export function registerOllamaRoutes(app: Express) {
  app.get("/health", async (_request, response) => {
    try {
      const [models, version] = await Promise.all([getModels(), getVersion()]);

      response.json({
        ok: true,
        app: {
          name: appConfig.name,
          version: appConfig.version,
        },
        ollama: {
          running: true,
          modelCount: models.length,
          version: version.version,
        },
      });
    } catch (error) {
      const ollamaError = toOllamaHttpError(error);

      response.status(200).json({
        ok: false,
        app: {
          name: appConfig.name,
          version: appConfig.version,
        },
        ollama: {
          running: false,
          modelCount: 0,
        },
        message: ollamaError.message,
      });
    }
  });

  app.get("/version", async (_request, response) => {
    try {
      const version = await getVersion();

      response.json({
        app: {
          name: appConfig.name,
          version: appConfig.version,
        },
        ollama: version,
      });
    } catch {
      response.json({
        app: {
          name: appConfig.name,
          version: appConfig.version,
        },
      });
    }
  });

  app.get("/models", async (_request, response) => {
    try {
      response.json({ models: await getModels() });
    } catch (error) {
      const ollamaError = toOllamaHttpError(error);
      response
        .status(ollamaError.statusCode)
        .json({ message: ollamaError.message });
    }
  });

  app.post("/chat", async (request, response) => {
    try {
      const body = parseChatBody(request.body);
      const content = await chatComplete(
        body.model,
        body.messages,
        body.options
      );

      response.json({ content });
    } catch (error) {
      const ollamaError = toOllamaHttpError(error);
      response
        .status(ollamaError.statusCode)
        .json({ message: ollamaError.message });
    }
  });

  app.post("/stream", async (request, response) => {
    const abortController = new AbortController();
    let sentDone = false;

    function sendEvent(event: unknown) {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    request.on("close", () => {
      abortController.abort();
    });

    try {
      const body = parseChatBody(request.body);

      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const ollamaStream = await openChatStream(
        body.model,
        body.messages,
        body.options,
        abortController.signal
      );

      let buffer = "";

      ollamaStream.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line) as {
              message?: { content?: string };
              response?: string;
              done?: boolean;
              [key: string]: unknown;
            };
            const token = parsed.message?.content ?? parsed.response ?? "";

            if (token) sendEvent({ type: "token", content: token });

            if (parsed.done && !sentDone) {
              sentDone = true;
              const { message: _message, response: _response, ...stats } = parsed;
              sendEvent({ type: "done", stats });
              response.end();
            }
          } catch {
            sendEvent({
              type: "error",
              message: "Unable to parse Ollama stream chunk.",
            });
          }
        }
      });

      ollamaStream.on("end", () => {
        if (!response.writableEnded && !sentDone) {
          sendEvent({ type: "done" });
          response.end();
        }
      });

      ollamaStream.on("error", (error) => {
        if (response.writableEnded) return;

        sendEvent({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Ollama stream ended unexpectedly.",
        });
        response.end();
      });
    } catch (error) {
      const ollamaError = toOllamaHttpError(error);

      if (response.headersSent) {
        sendEvent({ type: "error", message: ollamaError.message });
        response.end();
        return;
      }

      response
        .status(ollamaError.statusCode)
        .json({ message: ollamaError.message });
    }
  });
}
