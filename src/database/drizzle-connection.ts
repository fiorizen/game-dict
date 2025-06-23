import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import { eq, sql } from "drizzle-orm";
import {
	type BetterSQLite3Database,
	drizzle,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
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
		DrizzleConnection.instance = undefined!;
	}

	private getDatabasePath(): string {
		// テスト環境の判定（環境変数優先）
		const isTestEnv =
			process.env.NODE_ENV === "test" || process.env.VITEST === "true";

		if (isTestEnv) {
			// テスト環境では専用のパスを使用
			const testDbPath = path.join(
				process.cwd(),
				"test-data",
				"game-dict-test.db",
			);
			console.log("Using test database:", testDbPath);
			return testDbPath;
		}

		// In Electron environment (main process or renderer with remote access)
		try {
			// Try dynamic import first for ESM compatibility
			const electronModule =
				typeof require !== "undefined" ? require("electron") : null;

			if (electronModule?.app) {
				const userDataPath = electronModule.app.getPath("userData");
				const prodDbPath = path.join(userDataPath, "game-dict.db");
				console.log("Using production database:", prodDbPath);
				return prodDbPath;
			}
		} catch (error) {
			console.warn("Failed to access Electron app:", error);
		}

		// For testing environment, check if app is available in global
		if (
			typeof global !== "undefined" &&
			(global as { app?: { getPath: (path: string) => string } }).app
		) {
			const globalWithApp = global as unknown as {
				app: { getPath: (path: string) => string };
			};
			const userDataPath = globalWithApp.app.getPath("userData");
			const prodDbPath = path.join(userDataPath, "game-dict.db");
			console.log("Using production database:", prodDbPath);
			return prodDbPath;
		}

		// Production fallback - use OS user data directory
		if (process.env.NODE_ENV === "production") {
			const os = typeof require !== "undefined" ? require("node:os") : null;
			if (os) {
				const homeDir = os.homedir();
				const userDataPath = path.join(
					homeDir,
					"Library",
					"Application Support",
					"game-dict",
				);
				const prodDbPath = path.join(userDataPath, "game-dict.db");
				console.log("Using production database (fallback):", prodDbPath);
				return prodDbPath;
			}
		}

		// Default fallback
		const defaultDbPath = path.join(process.cwd(), "test-data", "game-dict.db");
		console.log("Using default database:", defaultDbPath);
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
			console.warn(
				"Migration failed, falling back to manual table creation:",
				error,
			);
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
				code TEXT NOT NULL UNIQUE,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Migrate existing games table if needed
		this.migrateGamesTable();

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

	private migrateGamesTable(): void {
		// Check if code column exists
		const tableInfo = this.sqlite
			.prepare("PRAGMA table_info(games)")
			.all() as Array<{
			cid: number;
			name: string;
			type: string;
			notnull: number;
			dflt_value: any;
			pk: number;
		}>;

		const codeColumnExists = tableInfo.some((column) => column.name === "code");

		if (!codeColumnExists) {
			console.log("Adding code column to games table...");

			// Add code column (without NOT NULL constraint initially)
			this.sqlite.exec("ALTER TABLE games ADD COLUMN code TEXT");

			// Generate codes for existing games
			const existingGames = this.sqlite
				.prepare("SELECT id, name FROM games")
				.all() as Array<{
				id: number;
				name: string;
			}>;

			if (existingGames.length > 0) {
				const updateCode = this.sqlite.prepare(
					"UPDATE games SET code = ? WHERE id = ?",
				);

				for (const game of existingGames) {
					const existingCodes = existingGames
						.filter((g) => g.id !== game.id)
						.map((g) => this.generateCodeFromName(g.name))
						.filter((code): code is string => Boolean(code));
					const generatedCode = this.generateUniqueCodeFromName(
						game.name,
						existingCodes,
					);
					updateCode.run(generatedCode, game.id);
				}
			}

			// Now add the UNIQUE constraint
			this.sqlite.exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_games_code ON games(code);
			`);

			console.log("Code column migration completed.");
		}
	}

	private generateCodeFromName(name: string): string {
		if (!name) return "";

		return name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "")
			.substring(0, 16);
	}

	private generateUniqueCodeFromName(
		name: string,
		existingCodes: string[],
	): string {
		let baseCode = this.generateCodeFromName(name);
		if (!baseCode) {
			baseCode = "game";
		}

		let code = baseCode;
		let counter = 1;

		// Ensure uniqueness
		while (existingCodes.includes(code)) {
			const suffix = counter.toString();
			const maxBaseLength = 16 - suffix.length;
			code = baseCode.substring(0, maxBaseLength) + suffix;
			counter++;
		}

		return code;
	}

	private insertDefaultCategories(): void {
		const defaultCategories = [
			{
				name: "名詞",
				googleImeName: "名詞",
				msImeName: "名詞",
				atokName: "名詞",
			},
			{
				name: "品詞なし",
				googleImeName: "名詞",
				msImeName: "名詞",
				atokName: "名詞",
			},
			{
				name: "人名",
				googleImeName: "人名",
				msImeName: "人名",
				atokName: "人名",
			},
		];

		// Insert or update default categories
		for (const category of defaultCategories) {
			try {
				// Try to insert
				this.db.insert(schema.categories).values(category).run();
			} catch (error) {
				// If UNIQUE constraint failed, update existing category
				if ((error as any).message?.includes("UNIQUE constraint failed")) {
					this.db
						.update(schema.categories)
						.set({
							googleImeName: category.googleImeName,
							msImeName: category.msImeName,
							atokName: category.atokName,
						})
						.where(eq(schema.categories.name, category.name))
						.run();
				} else {
					throw error;
				}
			}
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
