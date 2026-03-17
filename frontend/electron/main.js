import { app, BrowserWindow } from "electron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let backendProcess = null;

function getBackendDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }
  return path.join(__dirname, "..", "..", "backend");
}

function startBackend() {
  const backendDir = getBackendDir();
  const serverPath = path.join(backendDir, "server.js");

  let command, args, env;
  if (app.isPackaged) {
    command = process.execPath;
    args = [serverPath];
    env = { ...process.env, ELECTRON_RUN_AS_NODE: "1" };
  } else {
    command = "node";
    args = [serverPath];
    env = { ...process.env };
  }

  backendProcess = spawn(command, args, {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });

  backendProcess.stdout?.on("data", (data) => {
    console.log(`[backend] ${data}`);
  });

  backendProcess.stderr?.on("data", (data) => {
    console.error(`[backend] ${data}`);
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
