export const appConfig = {
  name: "LocalMind AI",
  version: "0.1.0",
  defaultPort: 3217,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  requestTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 120_000),
};
