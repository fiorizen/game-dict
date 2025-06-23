/**
 * 統一ロギングシステム
 * 開発環境でのみログ出力し、本番環境では出力を抑制
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class Logger {
	private static instance: Logger;
	private logLevel: LogLevel;

	private constructor() {
		// テスト環境では重要なログのみ
		if (process.env.NODE_ENV === "test") {
			this.logLevel = LogLevel.ERROR;
		}
		// 本番環境ではエラーのみ
		else if (process.env.NODE_ENV === "production") {
			this.logLevel = LogLevel.ERROR;
		}
		// 開発環境では全てのログ
		else {
			this.logLevel = LogLevel.DEBUG;
		}
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	public debug(message: string, ...args: unknown[]): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			console.log(`[DEBUG] ${message}`, ...args);
		}
	}

	public info(message: string, ...args: unknown[]): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.log(`[INFO] ${message}`, ...args);
		}
	}

	public warn(message: string, ...args: unknown[]): void {
		if (this.shouldLog(LogLevel.WARN)) {
			console.warn(`[WARN] ${message}`, ...args);
		}
	}

	public error(message: string, ...args: unknown[]): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			console.error(`[ERROR] ${message}`, ...args);
		}
	}

	/**
	 * データベース関連のログ（開発時のみ）
	 */
	public database(operation: string, details?: string): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			const message = details ? `${operation}: ${details}` : operation;
			console.log(`[DB] ${message}`);
		}
	}

	/**
	 * データ同期関連のログ（重要なため本番でも出力）
	 */
	public dataSync(message: string, ...args: unknown[]): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.log(`[SYNC] ${message}`, ...args);
		}
	}
}

// 便利な関数エクスポート
const logger = Logger.getInstance();
export const log = {
	debug: logger.debug.bind(logger),
	info: logger.info.bind(logger),
	warn: logger.warn.bind(logger),
	error: logger.error.bind(logger),
	database: logger.database.bind(logger),
	dataSync: logger.dataSync.bind(logger),
};
