import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { registerOllamaRoutes } from "./routes/ollama";

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message =
    error instanceof Error ? error.message : "Unexpected LocalMind API error.";

  response.status(500).json({ message });
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/],
    })
  );
  app.use(express.json({ limit: "2mb" }));

  registerOllamaRoutes(app);

  app.use((_request, response) => {
    response.status(404).json({ message: "Endpoint not found." });
  });
  app.use(errorHandler);

  return app;
}
