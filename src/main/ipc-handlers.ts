// @ts-nocheck
import { dialog, ipcMain } from "electron";
import { Database } from "../database/index.js";
import { CSVHandlers } from "./csv-handlers.js";
import { DataSyncManager, type DataSyncChoice, type ExitSyncChoice } from "./data-sync-manager.js";
import type {
	CreateCategoryData,
	CreateEntryData,
	CreateGameData,
	UpdateCategoryData,
	UpdateEntryData,
	UpdateGameData,
} from "../shared/types.js";

export class IPCHandlers {
	private db: Database;
	private csvHandlers: CSVHandlers;
	private dataSyncManager: DataSyncManager;

	constructor() {
		this.db = Database.getInstance();
		this.csvHandlers = new CSVHandlers();
		this.dataSyncManager = new DataSyncManager();
		this.setupHandlers();
	}

	private setupHandlers(): void {
		// Game handlers
		ipcMain.handle("games:getAll", () => this.db.games.getAll());
		ipcMain.handle("games:getById", (_, id: number) =>
			this.db.games.getById(id),
		);
		ipcMain.handle("games:create", (_, data: CreateGameData) =>
			this.db.games.create(data),
		);
		ipcMain.handle("games:update", (_, id: number, data: UpdateGameData) =>
			this.db.games.update(id, data),
		);
		ipcMain.handle("games:delete", (_, id: number) => this.db.games.delete(id));

		// Category handlers
		ipcMain.handle("categories:getAll", () => this.db.categories.getAll());
		ipcMain.handle("categories:getById", (_, id: number) =>
			this.db.categories.getById(id),
		);
		ipcMain.handle("categories:create", (_, data: CreateCategoryData) =>
			this.db.categories.create(data),
		);
		ipcMain.handle(
			"categories:update",
			(_, id: number, data: UpdateCategoryData) =>
				this.db.categories.update(id, data),
		);
		ipcMain.handle("categories:delete", (_, id: number) =>
			this.db.categories.delete(id),
		);

		// Entry handlers
		ipcMain.handle("entries:getAll", () => this.db.entries.getAll());
		ipcMain.handle("entries:getById", (_, id: number) =>
			this.db.entries.getById(id),
		);
		ipcMain.handle("entries:getByGameId", (_, gameId: number) =>
			this.db.entries.getByGameId(gameId),
		);
		ipcMain.handle("entries:getByGameIdUnsorted", (_, gameId: number) =>
			this.db.entries.getByGameIdUnsorted(gameId),
		);
		ipcMain.handle("entries:create", (_, data: CreateEntryData) =>
			this.db.entries.create(data),
		);
		ipcMain.handle("entries:update", (_, id: number, data: UpdateEntryData) =>
			this.db.entries.update(id, data),
		);
		ipcMain.handle("entries:delete", (_, id: number) =>
			this.db.entries.delete(id),
		);
		ipcMain.handle("entries:search", (_, query: string) =>
			this.db.entries.search(query),
		);

		// CSV handlers
		ipcMain.handle("csv:exportToGitCsv", async (_, outputDir?: string) => {
			try {
				const exportedFiles = await this.csvHandlers.exportToGitCsv(outputDir);
				return { success: true, files: exportedFiles };
			} catch (error) {
				throw new Error(`CSV export failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle(
			"csv:exportToImeCsv",
			async (_, gameId: number, format: "google" | "ms" | "atok", outputPath?: string) => {
				try {
					const suggestedPaths = this.csvHandlers.getSuggestedPaths(gameId);
					const path = outputPath || suggestedPaths[`${format}Csv`];
					await this.csvHandlers.exportToImeCsv(gameId, format, path);
					return { success: true, path };
				} catch (error) {
					throw new Error(`IME CSV export failed: ${error instanceof Error ? error.message : String(error)}`);
				}
			},
		);

		ipcMain.handle("csv:importFromCsv", async (_, filePath: string) => {
			try {
				await this.csvHandlers.importFromCsv(filePath);
				return { success: true };
			} catch (error) {
				throw new Error(`CSV import failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("csv:importFromGitCsvDirectory", async (_, inputDir: string) => {
			try {
				await this.csvHandlers.importFromGitCsvDirectory(inputDir);
				return { success: true };
			} catch (error) {
				throw new Error(`CSV directory import failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("csv:getSuggestedPaths", async (_, gameId?: number) => {
			return this.csvHandlers.getSuggestedPaths(gameId);
		});

		// File dialog handlers
		ipcMain.handle("files:showOpenDialog", async (_, options) => {
			const result = await dialog.showOpenDialog(options);
			return result;
		});

		ipcMain.handle("files:showSaveDialog", async (_, options) => {
			const result = await dialog.showSaveDialog(options);
			return result;
		});

		// Data sync handlers
		ipcMain.handle("dataSync:analyzeStatus", () => {
			try {
				return this.dataSyncManager.analyzeDataStatus();
			} catch (error) {
				throw new Error(`Data sync analysis failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("dataSync:performAutoImport", async () => {
			try {
				return await this.dataSyncManager.performAutoImport();
			} catch (error) {
				throw new Error(`Auto import failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("dataSync:performUserChoice", async (_, choice: DataSyncChoice) => {
			try {
				return await this.dataSyncManager.performUserChoice(choice);
			} catch (error) {
				throw new Error(`User choice execution failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("dataSync:getConflictMessage", (_, status) => {
			try {
				return this.dataSyncManager.getConflictMessage(status);
			} catch (error) {
				throw new Error(`Conflict message generation failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		// Exit sync handlers
		ipcMain.handle("exitSync:analyzeStatus", () => {
			try {
				return this.dataSyncManager.analyzeExitStatus();
			} catch (error) {
				throw new Error(`Exit sync analysis failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("exitSync:performAutoExport", async () => {
			try {
				return await this.dataSyncManager.performAutoExport();
			} catch (error) {
				throw new Error(`Auto export failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("exitSync:performUserChoice", async (_, choice: ExitSyncChoice) => {
			try {
				return await this.dataSyncManager.performExitChoice(choice);
			} catch (error) {
				throw new Error(`Exit choice execution failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("exitSync:getExitMessage", (_, status) => {
			try {
				return this.dataSyncManager.getExitMessage(status);
			} catch (error) {
				throw new Error(`Exit message generation failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("exitSync:markLastExportTime", () => {
			try {
				this.dataSyncManager.markLastExportTime();
				return { success: true };
			} catch (error) {
				throw new Error(`Mark export time failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		ipcMain.handle("app:forceClose", () => {
			try {
				// Request main app instance to force close
				const mainApp = (global as any).mainAppInstance;
				if (mainApp && typeof mainApp.requestForceClose === 'function') {
					mainApp.requestForceClose();
				}
				return { success: true };
			} catch (error) {
				throw new Error(`Force close failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		});
	}
}
