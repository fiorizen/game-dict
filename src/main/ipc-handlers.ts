import { dialog, ipcMain } from "electron";
import { Database } from "../database/index.js";
import { CSVHandlers } from "./csv-handlers.js";
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

	constructor() {
		this.db = Database.getInstance();
		this.csvHandlers = new CSVHandlers();
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
	}
}
