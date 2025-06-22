// Wrapper classes to provide legacy API compatibility with Drizzle ORM
import { DrizzleDatabase } from "./drizzle-database.js";
import {
	drizzleGameToLegacy,
	drizzleCategoryToLegacy,
	drizzleEntryToLegacy,
	drizzleEntryWithDetailsToLegacy,
	legacyGameToDrizzle,
	legacyCategoryToDrizzle,
	legacyEntryToDrizzle,
} from "./adapters.js";
import type { Game, Category, Entry, EntryWithDetails, NewGame, NewEntry, NewCategory } from "../shared/types.js";

class DrizzleGameWrapper {
	private drizzleDb: DrizzleDatabase;

	constructor(drizzleDb: DrizzleDatabase) {
		this.drizzleDb = drizzleDb;
	}

	public getAll(): Game[] {
		return this.drizzleDb.games.getAll()
			.map(drizzleGameToLegacy);
	}

	public getById(id: number): Game | null {
		const result = this.drizzleDb.games.getById(id);
		return result ? drizzleGameToLegacy(result) : null;
	}

	public create(data: NewGame): Game {
		const drizzleData = legacyGameToDrizzle(data);
		const result = this.drizzleDb.games.create(drizzleData);
		return drizzleGameToLegacy(result);
	}

	public update(id: number, data: Partial<NewGame>): Game | null {
		const drizzleData: { name?: string; code?: string } = {};
		if (data.name) drizzleData.name = data.name;
		if (data.code) drizzleData.code = data.code;
		const result = this.drizzleDb.games.update(id, drizzleData);
		return result ? drizzleGameToLegacy(result) : null;
	}

	public delete(id: number): boolean {
		return this.drizzleDb.games.delete(id);
	}

	public getByName(name: string): Game | null {
		const result = this.drizzleDb.games.getByName(name);
		return result ? drizzleGameToLegacy(result) : null;
	}

	public getByCode(code: string): Game | null {
		const result = this.drizzleDb.games.getByCode(code);
		return result ? drizzleGameToLegacy(result) : null;
	}
}

class DrizzleCategoryWrapper {
	private drizzleDb: DrizzleDatabase;

	constructor(drizzleDb: DrizzleDatabase) {
		this.drizzleDb = drizzleDb;
	}

	public getAll(): Category[] {
		return this.drizzleDb.categories.getAll()
			.map(drizzleCategoryToLegacy);
	}

	public getById(id: number): Category | null {
		const result = this.drizzleDb.categories.getById(id);
		return result ? drizzleCategoryToLegacy(result) : null;
	}

	public create(data: NewCategory): Category {
		const drizzleData = legacyCategoryToDrizzle(data);
		const result = this.drizzleDb.categories.create(drizzleData);
		return drizzleCategoryToLegacy(result);
	}

	public update(id: number, data: Partial<NewCategory>): Category | null {
		const drizzleData: any = {};
		if (data.name) drizzleData.name = data.name;
		if (data.google_ime_name !== undefined) drizzleData.googleImeName = data.google_ime_name;
		if (data.ms_ime_name !== undefined) drizzleData.msImeName = data.ms_ime_name;
		if (data.atok_name !== undefined) drizzleData.atokName = data.atok_name;

		const result = this.drizzleDb.categories.update(id, drizzleData);
		return result ? drizzleCategoryToLegacy(result) : null;
	}

	public delete(id: number): boolean {
		return this.drizzleDb.categories.delete(id);
	}
}

class DrizzleEntryWrapper {
	private drizzleDb: DrizzleDatabase;

	constructor(drizzleDb: DrizzleDatabase) {
		this.drizzleDb = drizzleDb;
	}

	public getAll(): Entry[] {
		return this.drizzleDb.entries.getAll()
			.map(drizzleEntryToLegacy);
	}

	public getAllWithDetails(): EntryWithDetails[] {
		return this.drizzleDb.entries.getAllWithDetails()
			.map(drizzleEntryWithDetailsToLegacy);
	}

	public getByGameId(gameId: number): Entry[] {
		return this.drizzleDb.entries.getByGameId(gameId)
			.map(drizzleEntryToLegacy);
	}

	public getByGameIdUnsorted(gameId: number): Entry[] {
		return this.drizzleDb.entries.getByGameIdUnsorted(gameId)
			.map(drizzleEntryToLegacy);
	}

	public getByGameIdWithDetails(gameId: number): EntryWithDetails[] {
		return this.drizzleDb.entries.getByGameIdWithDetails(gameId)
			.map(drizzleEntryWithDetailsToLegacy);
	}

	public getById(id: number): Entry | null {
		const result = this.drizzleDb.entries.getById(id);
		return result ? drizzleEntryToLegacy(result) : null;
	}

	public getByIdWithDetails(id: number): EntryWithDetails | null {
		const result = this.drizzleDb.entries.getByIdWithDetails(id);
		return result ? drizzleEntryWithDetailsToLegacy(result) : null;
	}

	public create(data: NewEntry): Entry {
		const drizzleData = legacyEntryToDrizzle(data);
		const result = this.drizzleDb.entries.create(drizzleData);
		return drizzleEntryToLegacy(result);
	}

	public update(id: number, data: Partial<NewEntry>): Entry | null {
		const drizzleData: any = {};
		if (data.game_id !== undefined) drizzleData.gameId = data.game_id;
		if (data.category_id !== undefined) drizzleData.categoryId = data.category_id;
		if (data.reading !== undefined) drizzleData.reading = data.reading;
		if (data.word !== undefined) drizzleData.word = data.word;
		if (data.description !== undefined) drizzleData.description = data.description;

		const result = this.drizzleDb.entries.update(id, drizzleData);
		return result ? drizzleEntryToLegacy(result) : null;
	}

	public delete(id: number): boolean {
		return this.drizzleDb.entries.delete(id);
	}

	public search(query: string, gameId?: number): EntryWithDetails[] {
		return this.drizzleDb.entries.search(query, gameId)
			.map(drizzleEntryWithDetailsToLegacy);
	}

	public deleteByGameId(gameId: number): number {
		return this.drizzleDb.entries.deleteByGameId(gameId);
	}
}

export class DrizzleDatabaseWrapper {
	private static instance: DrizzleDatabaseWrapper;
	private drizzleDb: DrizzleDatabase;
	public games: DrizzleGameWrapper;
	public categories: DrizzleCategoryWrapper;
	public entries: DrizzleEntryWrapper;

	private constructor() {
		this.drizzleDb = DrizzleDatabase.getInstance();
		this.games = new DrizzleGameWrapper(this.drizzleDb);
		this.categories = new DrizzleCategoryWrapper(this.drizzleDb);
		this.entries = new DrizzleEntryWrapper(this.drizzleDb);
	}

	public static getInstance(): DrizzleDatabaseWrapper {
		if (!DrizzleDatabaseWrapper.instance) {
			DrizzleDatabaseWrapper.instance = new DrizzleDatabaseWrapper();
		}
		return DrizzleDatabaseWrapper.instance;
	}

	public static resetInstance(): void {
		if (DrizzleDatabaseWrapper.instance) {
			DrizzleDatabase.resetInstance();
		}
		DrizzleDatabaseWrapper.instance = undefined as any;
	}

	public getDbPath(): string {
		return this.drizzleDb.getDbPath();
	}

	public close(): void {
		this.drizzleDb.close();
	}

	public getDatabase(): any {
		return this.drizzleDb.getConnection().getSqlite();
	}
}