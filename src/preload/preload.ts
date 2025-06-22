import { contextBridge, ipcRenderer } from "electron";
import type {
	CreateCategoryData,
	CreateEntryData,
	CreateGameData,
	UpdateCategoryData,
	UpdateEntryData,
	UpdateGameData,
} from "../shared/types.js";
import type { DataSyncChoice, ExitSyncChoice } from "../main/data-sync-manager.js";

// API definition for renderer process
const api = {
	// Game operations
	games: {
		getAll: () => ipcRenderer.invoke("games:getAll"),
		getById: (id: number) => ipcRenderer.invoke("games:getById", id),
		create: (data: CreateGameData) => ipcRenderer.invoke("games:create", data),
		update: (id: number, data: UpdateGameData) =>
			ipcRenderer.invoke("games:update", id, data),
		delete: (id: number) => ipcRenderer.invoke("games:delete", id),
		deleteWithRelatedEntries: (id: number) => 
			ipcRenderer.invoke("games:deleteWithRelatedEntries", id),
		getEntryCount: (id: number) => ipcRenderer.invoke("games:getEntryCount", id),
	},

	// Category operations
	categories: {
		getAll: () => ipcRenderer.invoke("categories:getAll"),
		getById: (id: number) => ipcRenderer.invoke("categories:getById", id),
		create: (data: CreateCategoryData) =>
			ipcRenderer.invoke("categories:create", data),
		update: (id: number, data: UpdateCategoryData) =>
			ipcRenderer.invoke("categories:update", id, data),
		delete: (id: number) => ipcRenderer.invoke("categories:delete", id),
	},

	// Entry operations
	entries: {
		getAll: () => ipcRenderer.invoke("entries:getAll"),
		getById: (id: number) => ipcRenderer.invoke("entries:getById", id),
		getByGameId: (gameId: number) =>
			ipcRenderer.invoke("entries:getByGameId", gameId),
		getByGameIdUnsorted: (gameId: number) =>
			ipcRenderer.invoke("entries:getByGameIdUnsorted", gameId),
		create: (data: CreateEntryData) =>
			ipcRenderer.invoke("entries:create", data),
		update: (id: number, data: UpdateEntryData) =>
			ipcRenderer.invoke("entries:update", id, data),
		delete: (id: number) => ipcRenderer.invoke("entries:delete", id),
		search: (query: string) => ipcRenderer.invoke("entries:search", query),
	},

	// CSV operations
	csv: {
		exportToGitCsv: (outputPath?: string) => 
			ipcRenderer.invoke("csv:exportToGitCsv", outputPath),
		exportToImeCsv: (gameId: number, format: "google" | "ms" | "atok", outputPath?: string) =>
			ipcRenderer.invoke("csv:exportToImeCsv", gameId, format, outputPath),
		importFromCsv: (filePath: string) =>
			ipcRenderer.invoke("csv:importFromCsv", filePath),
		importFromGitCsvDirectory: (inputDir: string) =>
			ipcRenderer.invoke("csv:importFromGitCsvDirectory", inputDir),
		getSuggestedPaths: (gameId?: number) =>
			ipcRenderer.invoke("csv:getSuggestedPaths", gameId),
	},

	// IME operations
	ime: {
		exportToMicrosoftIme: (gameId: number) =>
			ipcRenderer.invoke("ime:exportToMicrosoftIme", gameId),
	},

	// File operations
	files: {
		showOpenDialog: (options: any) =>
			ipcRenderer.invoke("files:showOpenDialog", options),
		showSaveDialog: (options: any) =>
			ipcRenderer.invoke("files:showSaveDialog", options),
	},

	// Data sync operations
	dataSync: {
		analyzeStatus: () => ipcRenderer.invoke("dataSync:analyzeStatus"),
		performAutoImport: () => ipcRenderer.invoke("dataSync:performAutoImport"),
		performUserChoice: (choice: DataSyncChoice) => 
			ipcRenderer.invoke("dataSync:performUserChoice", choice),
		getConflictMessage: (status: any) => 
			ipcRenderer.invoke("dataSync:getConflictMessage", status),
		onShowDialog: (callback: (status: any) => void) => {
			ipcRenderer.on("show-data-sync-dialog", (event, status) => callback(status));
		},
		removeAllListeners: () => {
			ipcRenderer.removeAllListeners("show-data-sync-dialog");
		},
	},

	// Exit sync operations
	exitSync: {
		analyzeStatus: () => ipcRenderer.invoke("exitSync:analyzeStatus"),
		performAutoExport: () => ipcRenderer.invoke("exitSync:performAutoExport"),
		performUserChoice: (choice: ExitSyncChoice) => 
			ipcRenderer.invoke("exitSync:performUserChoice", choice),
		getExitMessage: (status: any) => 
			ipcRenderer.invoke("exitSync:getExitMessage", status),
		markLastExportTime: () => ipcRenderer.invoke("exitSync:markLastExportTime"),
		onShowDialog: (callback: (status: any) => void) => {
			ipcRenderer.on("show-exit-sync-dialog", (event, status) => callback(status));
		},
		removeAllListeners: () => {
			ipcRenderer.removeAllListeners("show-exit-sync-dialog");
		},
	},

	// App control operations
	app: {
		forceClose: () => ipcRenderer.invoke("app:forceClose"),
	},
};

// Expose API to renderer process
contextBridge.exposeInMainWorld("electronAPI", api);

// Type definition for renderer process
export type ElectronAPI = typeof api;
