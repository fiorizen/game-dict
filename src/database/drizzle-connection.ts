import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

export class DrizzleConnection {
	private static instance: DrizzleConnection;
	private db: BetterSQLite3Database<typeof schema>;
	private sqlite: Database.Database;
	private dbPath: string;

	private constructor() {
		this.dbPath = this.getDatabasePath();

		// Ensure directory exists
		const dbDir = path.dirname(this.dbPath);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		this.sqlite = new Database(this.dbPath);
		this.sqlite.pragma("foreign_keys = ON");
		
		this.db = drizzle(this.sqlite, { schema });
		this.initializeDatabase();
	}

	public static getInstance(): DrizzleConnection {
		if (!DrizzleConnection.instance) {
			DrizzleConnection.instance = new DrizzleConnection();
		}
		return DrizzleConnection.instance;
	}

	public static resetInstance(): void {
		if (DrizzleConnection.instance) {
			try {
				DrizzleConnection.instance.close();
			} catch {
				// Ignore errors during close
			}
		}
		DrizzleConnection.instance = undefined as any;
	}

	private getDatabasePath(): string {
		// テスト環境の判定（環境変数優先）
		const isTestEnv = process.env.NODE_ENV === 'test' || 
						  process.env.VITEST === 'true';

		if (isTestEnv) {
			// テスト環境では専用のパスを使用
			const testDbPath = path.join(process.cwd(), "test-data", "game-dict-test.db");
			console.log('Using test database:', testDbPath);
			return testDbPath;
		}

		// For testing environment, check if app is available
		if (
			typeof global !== "undefined" &&
			(global as { app?: { getPath: (path: string) => string } }).app
		) {
			const globalWithApp = global as unknown as {
				app: { getPath: (path: string) => string };
			};
			const userDataPath = globalWithApp.app.getPath("userData");
			const prodDbPath = path.join(userDataPath, "game-dict.db");
			console.log('Using production database:', prodDbPath);
			return prodDbPath;
		}

		// In Electron environment
		if (typeof require !== "undefined") {
			try {
				const { app } = require("electron");
				const userDataPath = app.getPath("userData");
				const prodDbPath = path.join(userDataPath, "game-dict.db");
				console.log('Using production database:', prodDbPath);
				return prodDbPath;
			} catch {
				// Fallback for non-Electron environment
				const fallbackDbPath = path.join(process.cwd(), "test-data", "game-dict.db");
				console.log('Using fallback database:', fallbackDbPath);
				return fallbackDbPath;
			}
		}

		// Default fallback
		const defaultDbPath = path.join(process.cwd(), "test-data", "game-dict.db");
		console.log('Using default database:', defaultDbPath);
		return defaultDbPath;
	}

	private initializeDatabase(): void {
		// Run migrations if available
		try {
			const migrationsPath = path.join(process.cwd(), "migrations");
			if (fs.existsSync(migrationsPath)) {
				migrate(this.db, { migrationsFolder: migrationsPath });
			} else {
				// No migrations found, create tables manually
				this.createTablesManually();
			}
		} catch (error) {
			console.warn("Migration failed, falling back to manual table creation:", error);
			this.createTablesManually();
		}

		// Insert default categories
		this.insertDefaultCategories();
	}

	private createTablesManually(): void {
		// Create tables manually if migrations don't exist
		this.sqlite.exec(`
			CREATE TABLE IF NOT EXISTS games (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		this.sqlite.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				google_ime_name TEXT,
				ms_ime_name TEXT,
				atok_name TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		this.sqlite.exec(`
			CREATE TABLE IF NOT EXISTS entries (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				game_id INTEGER NOT NULL,
				category_id INTEGER NOT NULL,
				reading TEXT NOT NULL,
				word TEXT NOT NULL,
				description TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
				FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
			)
		`);

		// Create indexes
		this.sqlite.exec(`
			CREATE INDEX IF NOT EXISTS idx_entries_game_id ON entries(game_id);
			CREATE INDEX IF NOT EXISTS idx_entries_category_id ON entries(category_id);
			CREATE INDEX IF NOT EXISTS idx_entries_reading ON entries(reading);
		`);
	}

	private insertDefaultCategories(): void {
		const existingCategories = this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.categories)
			.all();

		if (existingCategories[0].count === 0) {
			const defaultCategories = [
				{
					name: "名詞",
					googleImeName: "一般",
					msImeName: "一般",
					atokName: "一般",
				},
				{
					name: "品詞なし",
					googleImeName: "一般",
					msImeName: "一般",
					atokName: "一般",
				},
				{
					name: "人名",
					googleImeName: "人名",
					msImeName: "人名",
					atokName: "人名",
				},
			];

			this.db.insert(schema.categories).values(defaultCategories).run();
		}
	}

	public getDatabase(): BetterSQLite3Database<typeof schema> {
		return this.db;
	}

	public getSqlite(): Database.Database {
		return this.sqlite;
	}

	public getDbPath(): string {
		return this.dbPath;
	}

	public close(): void {
		this.sqlite.close();
	}
}