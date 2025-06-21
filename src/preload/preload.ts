import { contextBridge, ipcRenderer } from "electron";
import type {
	CreateCategoryData,
	CreateEntryData,
	CreateGameData,
	UpdateCategoryData,
	UpdateEntryData,
	UpdateGameData,
} from "../shared/types.js";

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

	// File operations
	files: {
		showOpenDialog: (options: any) =>
			ipcRenderer.invoke("files:showOpenDialog", options),
		showSaveDialog: (options: any) =>
			ipcRenderer.invoke("files:showSaveDialog", options),
	},
};

// Expose API to renderer process
contextBridge.exposeInMainWorld("electronAPI", api);

// Type definition for renderer process
export type ElectronAPI = typeof api;
