"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// API definition for renderer process
const api = {
    // Game operations
    games: {
        getAll: () => electron_1.ipcRenderer.invoke("games:getAll"),
        getById: (id) => electron_1.ipcRenderer.invoke("games:getById", id),
        create: (data) => electron_1.ipcRenderer.invoke("games:create", data),
        update: (id, data) => electron_1.ipcRenderer.invoke("games:update", id, data),
        delete: (id) => electron_1.ipcRenderer.invoke("games:delete", id),
        deleteWithRelatedEntries: (id) => electron_1.ipcRenderer.invoke("games:deleteWithRelatedEntries", id),
        getEntryCount: (id) => electron_1.ipcRenderer.invoke("games:getEntryCount", id),
    },
    // Category operations
    categories: {
        getAll: () => electron_1.ipcRenderer.invoke("categories:getAll"),
        getById: (id) => electron_1.ipcRenderer.invoke("categories:getById", id),
        create: (data) => electron_1.ipcRenderer.invoke("categories:create", data),
        update: (id, data) => electron_1.ipcRenderer.invoke("categories:update", id, data),
        delete: (id) => electron_1.ipcRenderer.invoke("categories:delete", id),
    },
    // Entry operations
    entries: {
        getAll: () => electron_1.ipcRenderer.invoke("entries:getAll"),
        getById: (id) => electron_1.ipcRenderer.invoke("entries:getById", id),
        getByGameId: (gameId) => electron_1.ipcRenderer.invoke("entries:getByGameId", gameId),
        getByGameIdUnsorted: (gameId) => electron_1.ipcRenderer.invoke("entries:getByGameIdUnsorted", gameId),
        create: (data) => electron_1.ipcRenderer.invoke("entries:create", data),
        update: (id, data) => electron_1.ipcRenderer.invoke("entries:update", id, data),
        delete: (id) => electron_1.ipcRenderer.invoke("entries:delete", id),
        search: (query) => electron_1.ipcRenderer.invoke("entries:search", query),
    },
    // CSV operations
    csv: {
        exportToGitCsv: (outputPath) => electron_1.ipcRenderer.invoke("csv:exportToGitCsv", outputPath),
        exportToImeCsv: (gameId, format, outputPath) => electron_1.ipcRenderer.invoke("csv:exportToImeCsv", gameId, format, outputPath),
        importFromCsv: (filePath) => electron_1.ipcRenderer.invoke("csv:importFromCsv", filePath),
        importFromGitCsvDirectory: (inputDir) => electron_1.ipcRenderer.invoke("csv:importFromGitCsvDirectory", inputDir),
        getSuggestedPaths: (gameId) => electron_1.ipcRenderer.invoke("csv:getSuggestedPaths", gameId),
    },
    // IME operations
    ime: {
        exportToMicrosoftIme: (gameId) => electron_1.ipcRenderer.invoke("ime:exportToMicrosoftIme", gameId),
        exportAllGamesToMicrosoftIme: () => electron_1.ipcRenderer.invoke("ime:exportAllGamesToMicrosoftIme"),
        importFromImeTxt: (gameId, filePath) => electron_1.ipcRenderer.invoke("ime:importFromImeTxt", gameId, filePath),
    },
    // File operations
    files: {
        showOpenDialog: (options) => electron_1.ipcRenderer.invoke("files:showOpenDialog", options),
        showSaveDialog: (options) => electron_1.ipcRenderer.invoke("files:showSaveDialog", options),
    },
    // Data sync operations
    dataSync: {
        analyzeStatus: () => electron_1.ipcRenderer.invoke("dataSync:analyzeStatus"),
        performAutoImport: () => electron_1.ipcRenderer.invoke("dataSync:performAutoImport"),
        performUserChoice: (choice) => electron_1.ipcRenderer.invoke("dataSync:performUserChoice", choice),
        getConflictMessage: (status) => electron_1.ipcRenderer.invoke("dataSync:getConflictMessage", status),
        onShowDialog: (callback) => {
            electron_1.ipcRenderer.on("show-data-sync-dialog", (_event, status) => callback(status));
        },
        onCsvImportCompleted: (callback) => {
            electron_1.ipcRenderer.on("csv-import-completed", (_event) => callback());
        },
        removeAllListeners: () => {
            electron_1.ipcRenderer.removeAllListeners("show-data-sync-dialog");
            electron_1.ipcRenderer.removeAllListeners("csv-import-completed");
        },
    },
    // Exit sync operations
    exitSync: {
        analyzeStatus: () => electron_1.ipcRenderer.invoke("exitSync:analyzeStatus"),
        performAutoExport: () => electron_1.ipcRenderer.invoke("exitSync:performAutoExport"),
        performUserChoice: (choice) => electron_1.ipcRenderer.invoke("exitSync:performUserChoice", choice),
        getExitMessage: (status) => electron_1.ipcRenderer.invoke("exitSync:getExitMessage", status),
        markLastExportTime: () => electron_1.ipcRenderer.invoke("exitSync:markLastExportTime"),
        onShowDialog: (callback) => {
            electron_1.ipcRenderer.on("show-exit-sync-dialog", (_event, status) => callback(status));
        },
        removeAllListeners: () => {
            electron_1.ipcRenderer.removeAllListeners("show-exit-sync-dialog");
        },
    },
    // Pending (inbox) operations
    pending: {
        getAll: () => electron_1.ipcRenderer.invoke("pending:getAll"),
        confirm: (gameCode, word, description, yomi, categoryId) => electron_1.ipcRenderer.invoke("pending:confirm", gameCode, word, description, yomi, categoryId),
        discard: (gameCode, word) => electron_1.ipcRenderer.invoke("pending:discard", gameCode, word),
        updateWord: (gameCode, oldWord, newWord) => electron_1.ipcRenderer.invoke("pending:updateWord", gameCode, oldWord, newWord),
    },
    // App control operations
    app: {
        forceClose: () => electron_1.ipcRenderer.invoke("app:forceClose"),
    },
    // Auto-save operations
    autoSave: {
        start: () => electron_1.ipcRenderer.invoke("autoSave:start"),
        stop: () => electron_1.ipcRenderer.invoke("autoSave:stop"),
        getStatus: () => electron_1.ipcRenderer.invoke("autoSave:getStatus"),
        acknowledgeSkip: () => electron_1.ipcRenderer.invoke("autoSave:acknowledgeSkip"),
        onResult: (callback) => {
            electron_1.ipcRenderer.on("auto-save-result", (_event, result) => callback(result));
        },
        removeAllListeners: () => {
            electron_1.ipcRenderer.removeAllListeners("auto-save-result");
        },
    },
};
// Expose API to renderer process
electron_1.contextBridge.exposeInMainWorld("electronAPI", api);
//# sourceMappingURL=preload.js.map