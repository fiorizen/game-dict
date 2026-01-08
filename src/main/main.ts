import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import { log } from "../shared/logger.js";
import { AutoSaveManager } from "./auto-save-manager.js";
import { DataSyncManager, type ExitSyncStatus } from "./data-sync-manager.js";
import { IPCHandlers } from "./ipc-handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GameDictApp implements MainAppInstance {
	private ipcHandlers!: IPCHandlers;
	private dataSyncManager!: DataSyncManager;
	private autoSaveManager!: AutoSaveManager;
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		// Register this instance globally for IPC access
		global.mainAppInstance = this;

		this.setupApp();
	}

	private setupApp(): void {
		// Setup global app reference for database path resolution
		global.app = app;

		app.whenReady().then(() => {
			// Initialize IPC handlers and data sync manager after app is ready
			this.ipcHandlers = new IPCHandlers();
			this.dataSyncManager = new DataSyncManager();
			this.autoSaveManager = new AutoSaveManager();

			this.createMainWindow();
		});

		app.on("window-all-closed", () => {
			// Always quit the app when all windows are closed for this application
			app.quit();
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

		this.mainWindow.once("ready-to-show", async () => {
			await this.performDataSyncCheck();

			// Headless mode control for testing
			const isHeadless =
				process.env.NODE_ENV === "test" && process.env.HEADLESS === "true";
			if (!isHeadless) {
				this.mainWindow?.show();
			}
		});

		this.mainWindow.on("closed", () => {
			this.mainWindow = null;
		});

		// Handle window close event to show exit sync dialog
		this.mainWindow.on("close", async (event) => {
			// Skip exit sync in test environment
			if (process.env.NODE_ENV === "test") {
				return; // Allow normal close in test environment
			}

			// Always prevent the default close behavior to handle sync properly
			event.preventDefault();
			await this.handleWindowClose();
		});
	}

	/**
	 * アプリ起動時のCSV自動読み込みを実行
	 * 設計思想: CSVが権威あるデータソース、SQLiteは一時キャッシュ
	 */
	private async performDataSyncCheck(): Promise<void> {
		// Skip data sync check in test environment
		if (process.env.NODE_ENV === "test") {
			log.debug("Skipping CSV auto-import in test environment");
			return;
		}

		try {
			// CSVファイルの存在確認
			const status = this.dataSyncManager.analyzeDataStatus();

			if (status.csvFilesExist) {
				log.dataSync("起動時CSV自動読み込みを実行中...");
				const result = await this.dataSyncManager.performAutoImport();
				if (result.success) {
					log.dataSync("CSV自動読み込みが完了しました");
					// CSV読み込み完了をレンダラープロセスに通知
					this.mainWindow?.webContents.send("csv-import-completed");
				} else {
					log.error("CSV自動読み込みに失敗:", result.error);
				}
			} else {
				log.debug("CSVファイルが見つからないため読み込みをスキップ");
			}
		} catch (error) {
			log.error("CSV自動読み込みエラー:", error);
		}
	}

	/**
	 * ウィンドウクローズ処理
	 */
	private async handleWindowClose(): Promise<void> {
		try {
			const status = this.dataSyncManager.analyzeExitStatus();

			switch (status.recommendation) {
				case "auto_export": {
					// 自動エクスポート
					log.dataSync("終了時CSV自動エクスポートを実行中...");
					const result = await this.dataSyncManager.performAutoExport();
					if (result.success) {
						log.dataSync("CSV自動エクスポートが完了しました");
					} else {
						log.error("CSV自動エクスポートに失敗:", result.error);
					}
					this.forceClose();
					break;
				}

				case "user_confirm":
					// ユーザー確認が必要
					log.dataSync("終了時データ変更検出 - ユーザー確認が必要");
					this.showExitSyncDialog(status);
					break;
				default:
					// 何もしない
					log.debug("終了時CSV出力をスキップ（変更なし）");
					this.forceClose();
					break;
			}
		} catch (error) {
			log.error("終了時データ同期チェックエラー:", error);
			this.forceClose();
		}
	}

	/**
	 * 終了時データ同期確認ダイアログをレンダラープロセスに表示依頼
	 */
	private showExitSyncDialog(status: ExitSyncStatus): void {
		if (!this.mainWindow) return;

		// レンダラープロセスに終了時データ同期ダイアログ表示を依頼
		this.mainWindow.webContents.send("show-exit-sync-dialog", status);
	}

	/**
	 * 強制的にアプリを閉じる
	 */
	private forceClose(): void {
		if (this.mainWindow) {
			this.mainWindow.removeAllListeners("close");
			this.mainWindow.close();
		}
		// Ensure app quits
		app.quit();
	}

	/**
	 * 外部からの強制終了要求（ダイアログ処理完了後）
	 */
	requestForceClose(): void {
		this.forceClose();
	}

	/**
	 * メインウィンドウを取得
	 */
	getMainWindow(): BrowserWindow | null {
		return this.mainWindow;
	}

	/**
	 * 自動保存マネージャーを取得
	 */
	getAutoSaveManager(): AutoSaveManager {
		return this.autoSaveManager;
	}
}

new GameDictApp();
