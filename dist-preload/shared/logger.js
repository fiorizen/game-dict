"use strict";
/**
 * 統一ロギングシステム
 * 開発環境でのみログ出力し、本番環境では出力を抑制
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
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
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    shouldLog(level) {
        return level >= this.logLevel;
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    error(message, ...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
    /**
     * データベース関連のログ（開発時のみ）
     */
    database(operation, details) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const message = details ? `${operation}: ${details}` : operation;
            console.log(`[DB] ${message}`);
        }
    }
    /**
     * データ同期関連のログ（重要なため本番でも出力）
     */
    dataSync(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(`[SYNC] ${message}`, ...args);
        }
    }
}
exports.Logger = Logger;
// 便利な関数エクスポート
const logger = Logger.getInstance();
exports.log = {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    database: logger.database.bind(logger),
    dataSync: logger.dataSync.bind(logger),
};
//# sourceMappingURL=logger.js.map