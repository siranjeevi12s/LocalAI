import axios, { AxiosError } from "axios";
import { appConfig } from "../config";

export interface ChatRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerationOptions {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface OllamaModel {
  name: string;
  displayName: string;
  size?: number;
  modifiedAt?: string;
  digest?: string;
  details?: {
    family?: string;
    format?: string;
    parameterSize?: string;
    quantizationLevel?: string;
  };
}

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    model?: string;
    modified_at?: string;
    size?: number;
    digest?: string;
    details?: {
      family?: string;
      format?: string;
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
}

interface OllamaVersionResponse {
  version?: string;
}

interface OllamaChatResponse {
  message?: {
    role?: string;
    content?: string;
  };
}

export class OllamaError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "OllamaError";
    this.statusCode = statusCode;
  }
}

const client = axios.create({
  baseURL: appConfig.ollamaBaseUrl,
  timeout: appConfig.requestTimeoutMs,
});

function friendlyError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const code = axiosError.code;

    if (code === "ECONNREFUSED" || code === "ECONNRESET") {
      return new OllamaError(
        "Ollama is not running. Start Ollama locally and try again.",
        503
      );
    }

    if (code === "ETIMEDOUT" || code === "ECONNABORTED") {
      return new OllamaError(
        "Ollama did not respond in time. The model may still be loading.",
        504
      );
    }

    const status = axiosError.response?.status ?? 500;
    const responseData = axiosError.response?.data as
      | { error?: string; message?: string }
      | undefined;

    return new OllamaError(
      responseData?.error ||
        responseData?.message ||
        "Ollama returned an unexpected error.",
      status
    );
  }

  return new OllamaError(
    error instanceof Error ? error.message : "Unexpected Ollama error.",
    500
  );
}

function normalizeDisplayName(name: string) {
  return name.replace(/:latest$/, "");
}

function normalizeModel(
  model: NonNullable<OllamaTagsResponse["models"]>[number]
): OllamaModel | null {
  const name = model.name || model.model || "";
  if (!name) return null;

  return {
    name,
    displayName: normalizeDisplayName(name),
    size: model.size,
    modifiedAt: model.modified_at,
    digest: model.digest,
    details: {
      family: model.details?.family,
      format: model.details?.format,
      parameterSize: model.details?.parameter_size,
      quantizationLevel: model.details?.quantization_level,
    },
  };
}

export async function getModels() {
  try {
    const response = await client.get<OllamaTagsResponse>("/api/tags");

    return (response.data.models ?? [])
      .map(normalizeModel)
      .filter((model): model is OllamaModel => model !== null)
      .sort((first, second) =>
        first.displayName.localeCompare(second.displayName)
      );
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function getVersion() {
  try {
    const response = await client.get<OllamaVersionResponse>("/api/version");

    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function chatComplete(
  model: string,
  messages: ChatRequestMessage[],
  options: GenerationOptions
) {
  try {
    const response = await client.post<OllamaChatResponse>("/api/chat", {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        num_predict: options.maxTokens,
      },
    });

    return response.data.message?.content ?? "";
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function openChatStream(
  model: string,
  messages: ChatRequestMessage[],
  options: GenerationOptions,
  signal: AbortSignal
) {
  try {
    const response = await client.post(
      "/api/chat",
      {
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          num_predict: options.maxTokens,
        },
      },
      {
        responseType: "stream",
        signal,
        timeout: 0,
      }
    );

    return response.data as NodeJS.ReadableStream;
  } catch (error) {
    throw friendlyError(error);
  }
}

export function toOllamaHttpError(error: unknown) {
  return error instanceof OllamaError ? error : friendlyError(error);
}
