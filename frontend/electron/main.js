import { app, BrowserWindow, dialog } from "electron";
import { spawn } from "child_process";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let backendProcess = null;
let mainWindow = null;

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
  const iconFileName = process.platform === "win32" ? "app-icon.ico" : "app-icon.png";
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, iconFileName)
    : path.join(__dirname, "..", "public", iconFileName);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    title: "complaint-management-app",
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

  mainWindow = win;

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });
}

function setupAutoUpdates() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[updater] Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[updater] Update available: ${info.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[updater] App is up to date.");
  });

  autoUpdater.on("error", (error) => {
    console.error("[updater] Error while checking for updates:", error);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    console.log(`[updater] Update downloaded: ${info.version}`);

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update ready",
      message: "A new version has been downloaded.",
      detail: "Restart now to install the update.",
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  if (!app.isPackaged) {
    startBackend();
  }
  createWindow();
  setupAutoUpdates();

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
