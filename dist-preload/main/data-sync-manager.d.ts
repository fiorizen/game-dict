export interface DataSyncStatus {
    csvDirExists: boolean;
    csvFilesExist: boolean;
    csvGameCount: number;
    csvEntryCount: number;
    dbGameCount: number;
    dbEntryCount: number;
    hasConflict: boolean;
    conflictType: 'csv_missing' | 'db_has_more_data' | 'mixed_data' | 'safe' | null;
    recommendation: 'auto_import' | 'user_confirm' | 'skip_import';
}
export interface DataSyncChoice {
    action: 'import_csv' | 'keep_db' | 'backup_and_import';
    confirmed: boolean;
}
export interface ExitSyncStatus {
    hasChanges: boolean;
    lastExportTime: string | null;
    dbGameCount: number;
    dbEntryCount: number;
    csvGameCount: number;
    csvEntryCount: number;
    recommendation: 'auto_export' | 'user_confirm' | 'skip_export';
}
export interface ExitSyncChoice {
    action: 'export_csv' | 'skip_export';
    confirmed: boolean;
}
export declare class DataSyncManager {
    private db;
    private csvHandlers;
    private csvDir;
    private lastExportTime;
    private initialDataState;
    constructor(csvDir?: string);
    /**
     * アプリ起動時のデータ状況を分析
     */
    analyzeDataStatus(): DataSyncStatus;
    /**
     * データ競合状況を分析
     */
    private analyzeConflict;
    /**
     * CSVからの自動読み込み実行
     */
    performAutoImport(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * ユーザー選択に基づく処理実行
     */
    performUserChoice(choice: DataSyncChoice): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * CSVファイルからゲーム数をカウント
     */
    private countCsvGames;
    /**
     * CSVファイルからエントリ数をカウント
     */
    private countCsvEntries;
    /**
     * 初期データ状態を記録（変更検出用）
     */
    private recordInitialDataState;
    /**
     * 最後のエクスポート時刻を更新
     */
    markLastExportTime(): void;
    /**
     * アプリ終了時のデータ状況を分析
     */
    analyzeExitStatus(): ExitSyncStatus;
    /**
     * データに変更があるかどうかをチェック
     */
    private hasDataChanges;
    /**
     * 終了時のユーザー選択に基づく処理実行
     */
    performExitChoice(choice: ExitSyncChoice): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 自動エクスポート実行
     */
    performAutoExport(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * データ同期の説明メッセージを生成
     */
    getConflictMessage(status: DataSyncStatus): {
        title: string;
        message: string;
        options: Array<{
            label: string;
            action: DataSyncChoice['action'];
            description: string;
        }>;
    };
    /**
     * 終了時データ同期の説明メッセージを生成
     */
    getExitMessage(status: ExitSyncStatus): {
        title: string;
        message: string;
        options: Array<{
            label: string;
            action: ExitSyncChoice['action'];
            description: string;
        }>;
    };
}
//# sourceMappingURL=data-sync-manager.d.ts.map