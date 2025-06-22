// Legacy implementation using DrizzleDatabaseWrapper for backward compatibility
import { DrizzleDatabaseWrapper } from "./drizzle-wrapper.js";

// New Drizzle implementation
import { DrizzleDatabase } from "./drizzle-database.js";

export class Database {
	private static instance: Database;
	private wrapper: DrizzleDatabaseWrapper;
	public games: any;
	public categories: any;
	public entries: any;

	private constructor() {
		this.wrapper = DrizzleDatabaseWrapper.getInstance();
		this.games = this.wrapper.games;
		this.categories = this.wrapper.categories;
		this.entries = this.wrapper.entries;
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database();
		}
		return Database.instance;
	}

	public static resetInstance(): void {
		if (Database.instance) {
			try {
				Database.instance.close();
			} catch {
				// Ignore errors during close
			}
		}
		Database.instance = undefined as any;
		// Also reset the wrapper
		DrizzleDatabaseWrapper.resetInstance();
	}

	public getDbPath(): string {
		return this.wrapper.getDbPath();
	}

	public getDatabase(): import("better-sqlite3").Database {
		return this.wrapper.getDatabase();
	}

	public close(): void {
		this.wrapper.close();
	}
}

// Export new Drizzle database as the recommended implementation
export { DrizzleDatabase }

export * from "../shared/types.js";
export * from "./models/category.js";
export * from "./models/entry.js";
export * from "./models/game.js";
