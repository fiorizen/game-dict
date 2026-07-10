import type { OpenDialogOptions, SaveDialogOptions } from "electron";
import type { DataSyncChoice, DataSyncStatus, ExitSyncChoice, ExitSyncStatus } from "../main/data-sync-manager.js";
import type { CreateCategoryData, CreateEntryData, CreateGameData, UpdateCategoryData, UpdateEntryData, UpdateGameData } from "../shared/types.js";
declare const api: {
    games: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (data: CreateGameData) => Promise<any>;
        update: (id: number, data: UpdateGameData) => Promise<any>;
        delete: (id: number) => Promise<any>;
        deleteWithRelatedEntries: (id: number) => Promise<any>;
        getEntryCount: (id: number) => Promise<any>;
    };
    categories: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (data: CreateCategoryData) => Promise<any>;
        update: (id: number, data: UpdateCategoryData) => Promise<any>;
        delete: (id: number) => Promise<any>;
    };
    entries: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        getByGameId: (gameId: number) => Promise<any>;
        getByGameIdUnsorted: (gameId: number) => Promise<any>;
        create: (data: CreateEntryData) => Promise<any>;
        update: (id: number, data: UpdateEntryData) => Promise<any>;
        delete: (id: number) => Promise<any>;
        search: (query: string) => Promise<any>;
    };
    csv: {
        exportToGitCsv: (outputPath?: string) => Promise<any>;
        exportToImeCsv: (gameId: number, format: "google" | "ms" | "atok", outputPath?: string) => Promise<any>;
        importFromCsv: (filePath: string) => Promise<any>;
        importFromGitCsvDirectory: (inputDir: string) => Promise<any>;
        getSuggestedPaths: (gameId?: number) => Promise<any>;
    };
    ime: {
        exportToMicrosoftIme: (gameId: number) => Promise<any>;
        exportAllGamesToMicrosoftIme: () => Promise<any>;
        importFromImeTxt: (gameId: number, filePath: string) => Promise<any>;
    };
    files: {
        showOpenDialog: (options: OpenDialogOptions) => Promise<any>;
        showSaveDialog: (options: SaveDialogOptions) => Promise<any>;
    };
    dataSync: {
        analyzeStatus: () => Promise<any>;
        performAutoImport: () => Promise<any>;
        performUserChoice: (choice: DataSyncChoice) => Promise<any>;
        getConflictMessage: (status: DataSyncStatus) => Promise<any>;
        onShowDialog: (callback: (status: DataSyncStatus) => void) => void;
        onCsvImportCompleted: (callback: () => void) => void;
        removeAllListeners: () => void;
    };
    exitSync: {
        analyzeStatus: () => Promise<any>;
        performAutoExport: () => Promise<any>;
        performUserChoice: (choice: ExitSyncChoice) => Promise<any>;
        getExitMessage: (status: ExitSyncStatus) => Promise<any>;
        markLastExportTime: () => Promise<any>;
        onShowDialog: (callback: (status: ExitSyncStatus) => void) => void;
        removeAllListeners: () => void;
    };
    pending: {
        getAll: () => Promise<any>;
        confirm: (gameCode: string, word: string, description: string, yomi: string, categoryId: number) => Promise<any>;
        discard: (gameCode: string, word: string) => Promise<any>;
        updateWord: (gameCode: string, oldWord: string, newWord: string) => Promise<any>;
    };
    app: {
        forceClose: () => Promise<any>;
    };
    autoSave: {
        start: () => Promise<any>;
        stop: () => Promise<any>;
        getStatus: () => Promise<any>;
        acknowledgeSkip: () => Promise<any>;
        onResult: (callback: (result: {
            success: boolean;
            timestamp: string;
            skipped: boolean;
            reason?: string;
            sizeChanges?: Array<{
                filePath: string;
                oldSize: number;
                newSize: number;
                decreased: boolean;
            }>;
        }) => void) => void;
        removeAllListeners: () => void;
    };
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=preload.d.ts.map