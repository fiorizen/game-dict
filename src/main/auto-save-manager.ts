import { exec } from "node:child_process";
import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import { log } from "../shared/logger.js";
import { CSVHandlers } from "./csv-handlers.js";

const execAsync = promisify(exec);

/**
 * 自動保存の設定
 */
interface AutoSaveSettings {
	enabled: boolean;
	skipUntilAcknowledged: boolean;
}

/**
 * ファイルサイズの変更情報
 */
interface FileSizeChange {
	filePath: string;
	oldSize: number;
	newSize: number;
	decreased: boolean;
}

/**
 * IME辞書登録の結果
 */
export interface ImeRegistrationResult {
	success: boolean;
	skipped: boolean;
	reason?: string;
}

/**
 * 自動保存の実行結果
 */
export interface AutoSaveResult {
	success: boolean;
	timestamp: string;
	skipped: boolean;
	reason?: string;
	sizeChanges?: FileSizeChange[];
	imeRegistration?: ImeRegistrationResult;
}

/**
 * 自動保存マネージャー
 * 5分ごとにCSVファイルを自動保存し、ファイルサイズの減少を検出する
 */
export class AutoSaveManager {
	private static readonly INTERVAL_MS = 5 * 60 * 1000; // 5分
	private static readonly SETTINGS_FILE = "auto-save-settings.json";

	private csvHandlers: CSVHandlers;
	private timer: NodeJS.Timeout | null = null;
	private settings: AutoSaveSettings;
	private lastSaveTime: string | null = null;
	private nextSaveTime: string | null = null;

	constructor() {
		this.csvHandlers = new CSVHandlers();
		this.settings = this.loadSettings();

		// テスト環境では自動保存を開始しない
		const isTestEnvironment =
			process.env.NODE_ENV === "test" || process.env.VITEST === "true";

		// 自動保存が有効な場合、タイマーを開始（テスト環境を除く）
		if (this.settings.enabled && !isTestEnvironment) {
			this.start();
		}
	}

	/**
	 * 設定ファイルのパスを取得
	 */
	private getSettingsPath(): string {
		const userDataPath = app.getPath("userData");
		return path.join(userDataPath, AutoSaveManager.SETTINGS_FILE);
	}

	/**
	 * 設定を読み込む
	 */
	private loadSettings(): AutoSaveSettings {
		try {
			const settingsPath = this.getSettingsPath();
			if (fs.existsSync(settingsPath)) {
				const data = fs.readFileSync(settingsPath, "utf-8");
				return JSON.parse(data);
			}
		} catch (error) {
			log.error("設定ファイルの読み込みに失敗:", error);
		}

		// デフォルト設定
		return {
			enabled: true,
			skipUntilAcknowledged: false,
		};
	}

	/**
	 * 設定を保存
	 */
	private saveSettings(): void {
		try {
			const settingsPath = this.getSettingsPath();
			const userDataDir = path.dirname(settingsPath);

			// ユーザーデータディレクトリが存在しない場合は作成
			if (!fs.existsSync(userDataDir)) {
				fs.mkdirSync(userDataDir, { recursive: true });
			}

			fs.writeFileSync(
				settingsPath,
				JSON.stringify(this.settings, null, 2),
				"utf-8",
			);
		} catch (error) {
			log.error("設定ファイルの保存に失敗:", error);
		}
	}

	/**
	 * CSV出力ディレクトリを取得
	 */
	private getCsvDirectory(): string {
		const isTestEnvironment =
			process.env.NODE_ENV === "test" || process.env.VITEST === "true";
		return isTestEnvironment
			? path.join(process.cwd(), "test-data", "csv")
			: path.join(process.cwd(), "csv");
	}

	/**
	 * CSVファイルのサイズマップを取得
	 */
	private async getFileSizes(dir: string): Promise<Map<string, number>> {
		const sizeMap = new Map<string, number>();

		if (!fs.existsSync(dir)) {
			return sizeMap;
		}

		const files = fs.readdirSync(dir);
		for (const file of files) {
			if (file.endsWith(".csv")) {
				const filePath = path.join(dir, file);
				try {
					const stats = fs.statSync(filePath);
					sizeMap.set(file, stats.size);
				} catch (error) {
					log.error(`ファイルサイズの取得に失敗: ${filePath}`, error);
				}
			}
		}

		return sizeMap;
	}

	/**
	 * ファイルサイズの変更を検出
	 */
	private detectSizeChanges(
		oldSizes: Map<string, number>,
		newSizes: Map<string, number>,
	): FileSizeChange[] {
		const changes: FileSizeChange[] = [];
		const csvDir = this.getCsvDirectory();

		// 既存ファイルのサイズ変更をチェック
		for (const [fileName, newSize] of newSizes.entries()) {
			const oldSize = oldSizes.get(fileName) || 0;
			if (oldSize !== newSize) {
				changes.push({
					filePath: path.join(csvDir, fileName),
					oldSize,
					newSize,
					decreased: newSize < oldSize,
				});
			}
		}

		return changes;
	}

	/**
	 * 自動保存を実行
	 */
	private async performAutoSave(): Promise<AutoSaveResult> {
		const now = new Date().toISOString();

		// スキップフラグがセットされている場合はスキップ
		if (this.settings.skipUntilAcknowledged) {
			log.debug("自動保存スキップ（確認待ち）");
			this.updateNextSaveTime();
			return {
				success: false,
				timestamp: now,
				skipped: true,
				reason: "awaiting_acknowledgment",
			};
		}

		try {
			const csvDir = this.getCsvDirectory();

			// 保存前のファイルサイズを取得
			const oldSizes = await this.getFileSizes(csvDir);

			// CSV出力を実行
			await this.csvHandlers.exportToGitCsv();

			// 保存後のファイルサイズを取得
			const newSizes = await this.getFileSizes(csvDir);

			// ファイルサイズの変更を検出
			const sizeChanges = this.detectSizeChanges(oldSizes, newSizes);

			// サイズが減少したファイルがあるかチェック
			const decreasedFiles = sizeChanges.filter((change) => change.decreased);

			if (decreasedFiles.length > 0) {
				log.warn("ファイルサイズが減少しているため自動保存をスキップ:", {
					decreasedFiles,
				});

				// スキップフラグをセット
				this.settings.skipUntilAcknowledged = true;
				this.saveSettings();

				this.updateNextSaveTime();

				return {
					success: false,
					timestamp: now,
					skipped: true,
					reason: "size_decreased",
					sizeChanges: decreasedFiles,
				};
			}

			// 正常に保存完了
			this.lastSaveTime = now;
			this.updateNextSaveTime();

			log.info("自動保存が完了しました", {
				timestamp: now,
				changedFiles: sizeChanges.length,
			});

			// IME辞書登録（ベストエフォート）
			const imeRegistration = await this.runDictToolUpdate();

			return {
				success: true,
				timestamp: now,
				skipped: false,
				sizeChanges,
				imeRegistration,
			};
		} catch (error) {
			log.error("自動保存に失敗:", error);
			this.updateNextSaveTime();
			return {
				success: false,
				timestamp: now,
				skipped: false,
				reason: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * all-games.txt を生成して dict-tool でIME辞書に登録する
	 */
	private async runDictToolUpdate(): Promise<ImeRegistrationResult> {
		const cwd = path.join(homedir(), "Dev", "ime", "dict-tool");

		let allGamesTxtPath: string;
		try {
			const imeExport = await this.csvHandlers.exportAllGamesToMicrosoftIme();
			allGamesTxtPath = imeExport.filePath;
		} catch (error) {
			log.warn("all-games.txt の生成に失敗（IME登録スキップ）:", error);
			return {
				success: false,
				skipped: false,
				reason: error instanceof Error ? error.message : String(error),
			};
		}

		try {
			await execAsync(
				`uv run dict-tool update コンテンツ "${allGamesTxtPath}"`,
				{ cwd },
			);
			// exit 0 = 追加あり → reload 実行
			await execAsync("uv run dict-tool reload", { cwd });
			log.info("dict-tool: 登録・リロード完了");
			return { success: true, skipped: false };
		} catch (error) {
			if ((error as { code?: number }).code === 1) {
				// exit 1 = 追加なし → 正常（reloadスキップ）
				log.info("dict-tool: 追加なし（reloadスキップ）");
				return { success: true, skipped: true };
			}
			log.warn("dict-tool: 実行失敗（自動保存は完了）:", error);
			return {
				success: false,
				skipped: false,
				reason: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * 次回保存時刻を更新
	 */
	private updateNextSaveTime(): void {
		const next = new Date(Date.now() + AutoSaveManager.INTERVAL_MS);
		this.nextSaveTime = next.toISOString();
	}

	/**
	 * 自動保存タイマーを開始
	 */
	start(): void {
		if (this.timer) {
			log.warn("自動保存タイマーは既に実行中です");
			return;
		}

		this.settings.enabled = true;
		this.saveSettings();
		this.updateNextSaveTime();

		this.timer = setInterval(() => {
			this.performAutoSave().then((result) => {
				// レンダラープロセスに通知
				this.notifyRenderer("auto-save-result", result);
			});
		}, AutoSaveManager.INTERVAL_MS);

		log.info("自動保存タイマーを開始しました（5分間隔）");
	}

	/**
	 * 自動保存タイマーを停止
	 */
	stop(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
			this.nextSaveTime = null;
		}

		this.settings.enabled = false;
		this.saveSettings();

		log.info("自動保存タイマーを停止しました");
	}

	/**
	 * 自動保存が有効かどうかを取得
	 */
	isEnabled(): boolean {
		return this.settings.enabled;
	}

	/**
	 * スキップ状態を確認済みにする
	 */
	acknowledgeSkip(): void {
		this.settings.skipUntilAcknowledged = false;
		this.saveSettings();
		log.info("自動保存スキップ状態を解除しました");
	}

	/**
	 * 現在の状態を取得
	 */
	getStatus(): {
		enabled: boolean;
		skipUntilAcknowledged: boolean;
		lastSaveTime: string | null;
		nextSaveTime: string | null;
	} {
		return {
			enabled: this.settings.enabled,
			skipUntilAcknowledged: this.settings.skipUntilAcknowledged,
			lastSaveTime: this.lastSaveTime,
			nextSaveTime: this.nextSaveTime,
		};
	}

	/**
	 * レンダラープロセスに通知
	 */
	private notifyRenderer(channel: string, data: unknown): void {
		const mainWindow = global.mainAppInstance?.getMainWindow();
		if (mainWindow) {
			mainWindow.webContents.send(channel, data);
		}
	}
}
