import path from "node:path";
import { app, BrowserWindow, shell } from "electron";
import { startServer, type LocalMindServer } from "../server";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let mainWindow: BrowserWindow | null = null;
let apiServer: LocalMindServer | null = null;

async function createMainWindow(apiBaseUrl: string) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 768,
    minHeight: 620,
    title: "LocalMind AI",
    backgroundColor: "#111827",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      additionalArguments: [`--api-base-url=${apiBaseUrl}`],
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = isDev
      ? process.env.VITE_DEV_SERVER_URL
      : `file://${path.join(__dirname, "../renderer/index.html")}`;

    if (!url.startsWith(allowedOrigin ?? "")) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

async function bootstrap() {
  console.log("Bootstrapping server and main window...");
  const preferredPort = Number(process.env.LOCALMIND_PORT || 3217);
  console.log(`Starting API server on preferred port ${preferredPort}...`);
  apiServer = await startServer({ preferredPort });
  console.log(`API server successfully started on port ${apiServer.port}`);

  console.log("Creating main window...");
  await createMainWindow(`http://127.0.0.1:${apiServer.port}`);
  console.log("Main window loaded successfully.");
}

console.log("Starting LocalMind AI main process...");
const hasLock = app.requestSingleInstanceLock();

if (!hasLock && !isDev) {
  console.log("Another instance is running and we are in production. Exiting...");
  app.quit();
} else {
  if (!hasLock) {
    console.log("Warning: Another instance is running (or lock file exists), but we are in development. Bypassing lock check.");
  }

  app.on("second-instance", () => {
    console.log("Second instance detected, focusing main window.");
    if (!mainWindow) return;

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    console.log("Electron app ready, bootstrapping...");
    bootstrap().catch((error) => {
      console.error("Bootstrap failed with error:", error);
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0 && apiServer) {
        console.log("Re-activating app window...");
        createMainWindow(`http://127.0.0.1:${apiServer.port}`).catch((error) => {
          console.error("Failed to recreate main window on activate:", error);
        });
      }
    });
  });
}

app.on("window-all-closed", () => {
  console.log("All windows closed.");
  if (process.platform !== "darwin") {
    console.log("Quitting application.");
    app.quit();
  }
});

app.on("before-quit", () => {
  console.log("Application is quitting. Closing API server...");
  apiServer?.close();
});

