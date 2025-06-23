/**
 * 統一ロギングシステム
 * 開発環境でのみログ出力し、本番環境では出力を抑制
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static instance;
    private logLevel;
    private constructor();
    static getInstance(): Logger;
    private shouldLog;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    /**
     * データベース関連のログ（開発時のみ）
     */
    database(operation: string, details?: string): void;
    /**
     * データ同期関連のログ（重要なため本番でも出力）
     */
    dataSync(message: string, ...args: unknown[]): void;
}
export declare const log: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    database: (operation: string, details?: string) => void;
    dataSync: (message: string, ...args: unknown[]) => void;
};
//# sourceMappingURL=logger.d.ts.map