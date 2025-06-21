"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log("=== Preload script starting ===");
// API definition for renderer process
const api = {
    // Game operations
    games: {
        getAll: () => electron_1.ipcRenderer.invoke("games:getAll"),
        getById: (id) => electron_1.ipcRenderer.invoke("games:getById", id),
        create: (data) => electron_1.ipcRenderer.invoke("games:create", data),
        update: (id, data) => electron_1.ipcRenderer.invoke("games:update", id, data),
        delete: (id) => electron_1.ipcRenderer.invoke("games:delete", id),
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
        getSuggestedPaths: (gameId) => electron_1.ipcRenderer.invoke("csv:getSuggestedPaths", gameId),
    },
    // File operations
    files: {
        showOpenDialog: (options) => electron_1.ipcRenderer.invoke("files:showOpenDialog", options),
        showSaveDialog: (options) => electron_1.ipcRenderer.invoke("files:showSaveDialog", options),
    },
};
// Expose API to renderer process
console.log("=== Exposing electronAPI to main world ===");
electron_1.contextBridge.exposeInMainWorld("electronAPI", api);
console.log("=== electronAPI exposed successfully ===");
//# sourceMappingURL=preload.js.map