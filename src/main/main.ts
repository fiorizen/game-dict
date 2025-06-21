import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { app, BrowserWindow } from "electron";
import { IPCHandlers } from "./ipc-handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GameDictApp {
	private ipcHandlers: IPCHandlers;
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		this.ipcHandlers = new IPCHandlers();
		this.setupApp();
	}

	private setupApp(): void {
		// Setup global app reference for database path resolution
		(global as any).app = app;

		app.whenReady().then(() => {
			this.createMainWindow();
		});

		app.on("window-all-closed", () => {
			if (process.platform !== "darwin") {
				app.quit();
			}
		});

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				this.createMainWindow();
			}
		});
	}

	private createMainWindow(): void {
		const preloadPath = path.join(__dirname, "../preload/preload.js");
		
		this.mainWindow = new BrowserWindow({
			width: 1200,
			height: 800,
			minWidth: 800,
			minHeight: 600,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				preload: preloadPath,
			},
			title: "IME辞書管理ツール",
			show: false,
		});

		// Load the HTML file
		if (process.env.NODE_ENV === "development") {
			this.mainWindow.loadURL("http://localhost:3000");
			this.mainWindow.webContents.openDevTools();
		} else {
			this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
		}

		this.mainWindow.once("ready-to-show", () => {
			this.mainWindow?.show();
		});

		this.mainWindow.on("closed", () => {
			this.mainWindow = null;
		});
	}
}

new GameDictApp();
