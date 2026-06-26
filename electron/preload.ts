import { contextBridge } from "electron";

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

contextBridge.exposeInMainWorld("localMind", {
  apiBaseUrl: getArgument("api-base-url") || "http://127.0.0.1:3217",
  platform: process.platform,
});
