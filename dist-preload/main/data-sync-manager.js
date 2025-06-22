"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSyncManager = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const index_js_1 = require("../database/index.js");
const csv_handlers_js_1 = require("./csv-handlers.js");
class DataSyncManager {
    constructor(csvDir) {
        this.lastExportTime = null;
        this.initialDataState = null;
        this.db = index_js_1.Database.getInstance();
        this.csvHandlers = new csv_handlers_js_1.CSVHandlers();
        // Use test directory if in test environment or if explicitly provided
        const dbPath = this.db.getDbPath();
        const isTestEnvironment = dbPath.includes('test-data') || dbPath.includes('test') ||
            process.env.NODE_ENV === 'test';
        this.csvDir = csvDir || (isTestEnvironment
            ? node_path_1.default.join(process.cwd(), 'test-data', 'csv')
            : node_path_1.default.join(process.cwd(), 'csv'));
        // Record initial data state for change detection
        this.recordInitialDataState();
    }
    /**
     * アプリ起動時のデータ状況を分析
     */
    analyzeDataStatus() {
        const csvDirExists = node_fs_1.default.existsSync(this.csvDir);
        let csvFilesExist = false;
        let csvGameCount = 0;
        let csvEntryCount = 0;
        if (csvDirExists) {
            const files = node_fs_1.default.readdirSync(this.csvDir);
            const hasGamesFile = files.includes('games.csv');
            const hasGameFiles = files.some(f => f.startsWith('game-') && f.endsWith('.csv'));
            csvFilesExist = hasGamesFile || hasGameFiles;
            // CSVのデータ数をカウント
            if (hasGamesFile) {
                csvGameCount = this.countCsvGames();
            }
            if (hasGameFiles) {
                csvEntryCount = this.countCsvEntries();
            }
        }
        // SQLiteのデータ数をカウント
        const dbGameCount = this.db.games.getAll().length;
        const dbEntryCount = this.db.entries.getAll().length;
        // 競合状況を判定
        const conflictAnalysis = this.analyzeConflict(csvDirExists, csvFilesExist, csvGameCount, csvEntryCount, dbGameCount, dbEntryCount);
        return {
            csvDirExists,
            csvFilesExist,
            csvGameCount,
            csvEntryCount,
            dbGameCount,
            dbEntryCount,
            hasConflict: conflictAnalysis.hasConflict,
            conflictType: conflictAnalysis.type,
            recommendation: conflictAnalysis.recommendation
        };
    }
    /**
     * データ競合状況を分析
     */
    analyzeConflict(csvDirExists, csvFilesExist, csvGameCount, csvEntryCount, dbGameCount, dbEntryCount) {
        // ケース1: CSVディレクトリまたはファイルが存在しない
        if (!csvDirExists || !csvFilesExist) {
            if (dbGameCount > 0 || dbEntryCount > 0) {
                return {
                    hasConflict: true,
                    type: 'csv_missing',
                    recommendation: 'user_confirm'
                };
            }
            else {
                return {
                    hasConflict: false,
                    type: 'safe',
                    recommendation: 'skip_import'
                };
            }
        }
        // ケース2: SQLiteの方がデータが多い（作業中データがある可能性）
        if (dbGameCount > csvGameCount || dbEntryCount > csvEntryCount) {
            return {
                hasConflict: true,
                type: 'db_has_more_data',
                recommendation: 'user_confirm'
            };
        }
        // ケース3: 両方にデータがあるが、DBに実際のデータ（ゲームやエントリ）がある場合のみ混在とみなす
        if ((csvGameCount > 0 || csvEntryCount > 0) && (dbGameCount > 0 || dbEntryCount > 0)) {
            return {
                hasConflict: true,
                type: 'mixed_data',
                recommendation: 'user_confirm'
            };
        }
        // ケース4: 安全な読み込み（CSVのみ、またはDBにゲーム・エントリなし）
        return {
            hasConflict: false,
            type: 'safe',
            recommendation: 'auto_import'
        };
    }
    /**
     * CSVからの自動読み込み実行
     */
    async performAutoImport() {
        try {
            await this.csvHandlers.importFromGitCsvDirectory(this.csvDir);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * ユーザー選択に基づく処理実行
     */
    async performUserChoice(choice) {
        if (!choice.confirmed) {
            return { success: false, error: 'User cancelled operation' };
        }
        try {
            switch (choice.action) {
                case 'import_csv':
                    // CSVから読み込み（既存DBデータは上書きされる可能性）
                    await this.csvHandlers.importFromGitCsvDirectory(this.csvDir);
                    break;
                case 'keep_db':
                    // 何もしない（既存DBデータを保持）
                    break;
                case 'backup_and_import':
                    // 現在のDBデータをCSVにバックアップしてから読み込み
                    await this.csvHandlers.exportToGitCsv(this.csvDir);
                    await this.csvHandlers.importFromGitCsvDirectory(this.csvDir);
                    break;
                default:
                    return { success: false, error: 'Invalid choice action' };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * CSVファイルからゲーム数をカウント
     */
    countCsvGames() {
        try {
            const gamesFile = node_path_1.default.join(this.csvDir, 'games.csv');
            if (!node_fs_1.default.existsSync(gamesFile))
                return 0;
            const content = node_fs_1.default.readFileSync(gamesFile, 'utf-8');
            const lines = content.trim().split('\n');
            return Math.max(0, lines.length - 1); // ヘッダーを除く
        }
        catch {
            return 0;
        }
    }
    /**
     * CSVファイルからエントリ数をカウント
     */
    countCsvEntries() {
        try {
            const files = node_fs_1.default.readdirSync(this.csvDir);
            const gameFiles = files.filter(f => f.startsWith('game-') && f.endsWith('.csv'));
            let totalEntries = 0;
            for (const file of gameFiles) {
                const content = node_fs_1.default.readFileSync(node_path_1.default.join(this.csvDir, file), 'utf-8');
                const lines = content.trim().split('\n');
                // ヘッダーとコメント行を除いてカウント
                const dataLines = lines.filter(line => line.trim() && !line.startsWith('#') && !line.includes('category_name,reading,word'));
                totalEntries += dataLines.length;
            }
            return totalEntries;
        }
        catch {
            return 0;
        }
    }
    /**
     * 初期データ状態を記録（変更検出用）
     */
    recordInitialDataState() {
        this.initialDataState = {
            gameCount: this.db.games.getAll().length,
            entryCount: this.db.entries.getAll().length
        };
    }
    /**
     * 最後のエクスポート時刻を更新
     */
    markLastExportTime() {
        this.lastExportTime = new Date().toISOString();
    }
    /**
     * アプリ終了時のデータ状況を分析
     */
    analyzeExitStatus() {
        const currentGameCount = this.db.games.getAll().length;
        const currentEntryCount = this.db.entries.getAll().length;
        // CSVのデータ数をカウント
        const csvGameCount = this.countCsvGames();
        const csvEntryCount = this.countCsvEntries();
        // 変更があるかどうかをチェック
        const hasChanges = this.hasDataChanges(currentGameCount, currentEntryCount);
        // 推奨アクションを決定
        let recommendation = 'skip_export';
        if (hasChanges) {
            // 変更がある場合は常にユーザー確認
            recommendation = 'user_confirm';
        }
        else if (currentGameCount > 0 || currentEntryCount > 0) {
            // 変更はないが、データがありCSVがない場合は自動エクスポート
            if (csvGameCount === 0 && csvEntryCount === 0) {
                recommendation = 'auto_export';
            }
        }
        return {
            hasChanges,
            lastExportTime: this.lastExportTime,
            dbGameCount: currentGameCount,
            dbEntryCount: currentEntryCount,
            csvGameCount,
            csvEntryCount,
            recommendation
        };
    }
    /**
     * データに変更があるかどうかをチェック
     */
    hasDataChanges(currentGameCount, currentEntryCount) {
        if (!this.initialDataState) {
            // 初期状態が記録されていない場合は変更ありとみなす
            return currentGameCount > 0 || currentEntryCount > 0;
        }
        return (currentGameCount !== this.initialDataState.gameCount ||
            currentEntryCount !== this.initialDataState.entryCount);
    }
    /**
     * 終了時のユーザー選択に基づく処理実行
     */
    async performExitChoice(choice) {
        if (!choice.confirmed) {
            return { success: false, error: 'User cancelled operation' };
        }
        try {
            switch (choice.action) {
                case 'export_csv':
                    // CSVにエクスポート
                    await this.csvHandlers.exportToGitCsv(this.csvDir);
                    this.markLastExportTime();
                    break;
                case 'skip_export':
                    // 何もしない
                    break;
                default:
                    return { success: false, error: 'Invalid choice action' };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * 自動エクスポート実行
     */
    async performAutoExport() {
        try {
            await this.csvHandlers.exportToGitCsv(this.csvDir);
            this.markLastExportTime();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * データ同期の説明メッセージを生成
     */
    getConflictMessage(status) {
        switch (status.conflictType) {
            case 'csv_missing':
                return {
                    title: 'CSVファイルが見つかりません',
                    message: `CSVディレクトリまたはファイルが見つかりませんが、データベースには${status.dbGameCount}ゲーム、${status.dbEntryCount}エントリが存在します。どうしますか？`,
                    options: [
                        {
                            label: '既存データを保持',
                            action: 'keep_db',
                            description: 'データベースのデータをそのまま使用します'
                        },
                        {
                            label: 'データベースをCSVに保存',
                            action: 'backup_and_import',
                            description: '現在のデータをCSVファイルに保存します'
                        }
                    ]
                };
            case 'db_has_more_data':
                return {
                    title: 'データベースの方がデータが多いです',
                    message: `CSV: ${status.csvGameCount}ゲーム、${status.csvEntryCount}エントリ\nデータベース: ${status.dbGameCount}ゲーム、${status.dbEntryCount}エントリ\n\n作業中のデータが失われる可能性があります。`,
                    options: [
                        {
                            label: 'CSVから読み込み',
                            action: 'import_csv',
                            description: 'CSVのデータでデータベースを上書きします（作業中データは失われます）'
                        },
                        {
                            label: '既存データを保持',
                            action: 'keep_db',
                            description: 'データベースのデータをそのまま使用します'
                        },
                        {
                            label: 'データベースをCSVに保存してから読み込み',
                            action: 'backup_and_import',
                            description: '現在のデータをCSVに保存してから再読み込みします'
                        }
                    ]
                };
            case 'mixed_data':
                return {
                    title: 'データが混在しています',
                    message: `CSV と データベースの両方にデータが存在します。\nCSV: ${status.csvGameCount}ゲーム、${status.csvEntryCount}エントリ\nデータベース: ${status.dbGameCount}ゲーム、${status.dbEntryCount}エントリ`,
                    options: [
                        {
                            label: 'CSVから読み込み',
                            action: 'import_csv',
                            description: 'CSVのデータでデータベースを上書きします'
                        },
                        {
                            label: '既存データを保持',
                            action: 'keep_db',
                            description: 'データベースのデータをそのまま使用します'
                        }
                    ]
                };
            default:
                return {
                    title: 'データ同期',
                    message: 'データ同期処理を実行します。',
                    options: []
                };
        }
    }
    /**
     * 終了時データ同期の説明メッセージを生成
     */
    getExitMessage(status) {
        if (status.hasChanges) {
            return {
                title: 'データの変更が検出されました',
                message: `アプリの使用中にデータが変更されました。\n\n現在のデータ: ${status.dbGameCount}ゲーム、${status.dbEntryCount}エントリ\nCSVデータ: ${status.csvGameCount}ゲーム、${status.csvEntryCount}エントリ\n\n変更をCSVファイルに保存しますか？`,
                options: [
                    {
                        label: 'CSVに保存して終了',
                        action: 'export_csv',
                        description: '現在のデータをCSVファイルに保存してから終了します'
                    },
                    {
                        label: '保存せずに終了',
                        action: 'skip_export',
                        description: '変更を保存せずに終了します（変更は失われます）'
                    }
                ]
            };
        }
        else if (status.recommendation === 'auto_export') {
            return {
                title: 'データのバックアップ',
                message: `現在のデータをCSVファイルに保存します。\n\nデータ: ${status.dbGameCount}ゲーム、${status.dbEntryCount}エントリ`,
                options: [
                    {
                        label: 'CSVに保存',
                        action: 'export_csv',
                        description: 'データをCSVファイルに保存します'
                    },
                    {
                        label: 'スキップ',
                        action: 'skip_export',
                        description: 'CSVファイルへの保存をスキップします'
                    }
                ]
            };
        }
        else {
            return {
                title: 'アプリを終了します',
                message: '変更はありません。アプリを終了します。',
                options: []
            };
        }
    }
}
exports.DataSyncManager = DataSyncManager;
//# sourceMappingURL=data-sync-manager.js.map