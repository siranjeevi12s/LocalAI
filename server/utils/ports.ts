import net from "node:net";

function canListen(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function findAvailablePort(preferredPort: number) {
  for (let offset = 0; offset < 20; offset += 1) {
    const port = preferredPort + offset;
    if (await canListen(port)) return port;
  }

  throw new Error("No available LocalMind API port found.");
}
