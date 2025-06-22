import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { app, BrowserWindow } from "electron";
import { IPCHandlers } from "./ipc-handlers.js";
import { DataSyncManager } from "./data-sync-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GameDictApp {
	private ipcHandlers: IPCHandlers;
	private dataSyncManager: DataSyncManager;
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		this.ipcHandlers = new IPCHandlers();
		this.dataSyncManager = new DataSyncManager();
		
		// Register this instance globally for IPC access
		(global as any).mainAppInstance = this;
		
		this.setupApp();
	}

	private setupApp(): void {
		// Setup global app reference for database path resolution
		(global as any).app = app;

		app.whenReady().then(() => {
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
			this.mainWindow?.show();
		});

		this.mainWindow.on("closed", () => {
			this.mainWindow = null;
		});

		// Handle window close event to show exit sync dialog
		this.mainWindow.on("close", async (event) => {
			// Always prevent the default close behavior to handle sync properly
			event.preventDefault();
			await this.handleWindowClose();
		});
	}

	/**
	 * アプリ起動時のデータ同期チェックを実行
	 */
	private async performDataSyncCheck(): Promise<void> {
		try {
			const status = this.dataSyncManager.analyzeDataStatus();
			
			switch (status.recommendation) {
				case 'auto_import':
					// 安全な自動読み込み
					if (status.csvFilesExist) {
						console.log('起動時CSV自動読み込みを実行中...');
						const result = await this.dataSyncManager.performAutoImport();
						if (result.success) {
							console.log('CSV自動読み込みが完了しました');
						} else {
							console.error('CSV自動読み込みに失敗:', result.error);
						}
					}
					break;

				case 'user_confirm':
					// ユーザー確認が必要 - ウィンドウ表示後にダイアログを表示
					console.log('データ競合検出 - ユーザー確認が必要:', status.conflictType);
					// ウィンドウが表示された後にダイアログを表示するため、イベントを送信
					this.mainWindow?.webContents.once('did-finish-load', () => {
						this.showDataSyncDialog(status);
					});
					break;

				case 'skip_import':
					// 何もしない
					console.log('CSV読み込みをスキップ（データなし）');
					break;

				default:
					console.log('データ同期チェック完了（アクションなし）');
					break;
			}
		} catch (error) {
			console.error('データ同期チェックエラー:', error);
		}
	}

	/**
	 * データ同期確認ダイアログをレンダラープロセスに表示依頼
	 */
	private showDataSyncDialog(status: any): void {
		if (!this.mainWindow) return;
		
		// レンダラープロセスにデータ同期ダイアログ表示を依頼
		this.mainWindow.webContents.send('show-data-sync-dialog', status);
	}

	/**
	 * ウィンドウクローズ処理
	 */
	private async handleWindowClose(): Promise<void> {
		try {
			const status = this.dataSyncManager.analyzeExitStatus();
			
			switch (status.recommendation) {
				case 'auto_export':
					// 自動エクスポート
					console.log('終了時CSV自動エクスポートを実行中...');
					const result = await this.dataSyncManager.performAutoExport();
					if (result.success) {
						console.log('CSV自動エクスポートが完了しました');
					} else {
						console.error('CSV自動エクスポートに失敗:', result.error);
					}
					this.forceClose();
					break;

				case 'user_confirm':
					// ユーザー確認が必要
					console.log('終了時データ変更検出 - ユーザー確認が必要');
					this.showExitSyncDialog(status);
					break;

				case 'skip_export':
				default:
					// 何もしない
					console.log('終了時CSV出力をスキップ（変更なし）');
					this.forceClose();
					break;
			}
		} catch (error) {
			console.error('終了時データ同期チェックエラー:', error);
			this.forceClose();
		}
	}

	/**
	 * 終了時データ同期確認ダイアログをレンダラープロセスに表示依頼
	 */
	private showExitSyncDialog(status: any): void {
		if (!this.mainWindow) return;
		
		// レンダラープロセスに終了時データ同期ダイアログ表示を依頼
		this.mainWindow.webContents.send('show-exit-sync-dialog', status);
	}


	/**
	 * 強制的にアプリを閉じる
	 */
	private forceClose(): void {
		if (this.mainWindow) {
			this.mainWindow.removeAllListeners('close');
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
}

new GameDictApp();
