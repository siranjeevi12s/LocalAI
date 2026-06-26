import http from "node:http";
import { appConfig } from "./config";
import { createApp } from "./app";
import { findAvailablePort } from "./utils/ports";

export interface LocalMindServer {
  port: number;
  close: () => void;
}

export async function startServer(options?: {
  preferredPort?: number;
}): Promise<LocalMindServer> {
  const port = await findAvailablePort(
    options?.preferredPort ?? appConfig.defaultPort
  );
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    port,
    close: () => server.close(),
  };
}

if (require.main === module) {
  startServer()
    .then(({ port }) => {
      console.log(`LocalMind API listening at http://127.0.0.1:${port}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
