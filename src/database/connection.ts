import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export class DatabaseConnection {
	private static instance: DatabaseConnection;
	private db: Database.Database;
	private dbPath: string;

	private constructor() {
		this.dbPath = this.getDatabasePath();

		// Ensure directory exists
		const dbDir = path.dirname(this.dbPath);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		this.db = new Database(this.dbPath);
		this.db.pragma("foreign_keys = ON");
		this.initializeTables();
	}

	public static getInstance(): DatabaseConnection {
		if (!DatabaseConnection.instance) {
			DatabaseConnection.instance = new DatabaseConnection();
		}
		return DatabaseConnection.instance;
	}

	public static resetInstance(): void {
		if (DatabaseConnection.instance) {
			try {
				DatabaseConnection.instance.close();
			} catch {
				// Ignore errors during close
			}
		}
		DatabaseConnection.instance = undefined as any;
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

		// 本番環境では必ずユーザーデータディレクトリを使用
		if (process.env.NODE_ENV === 'production') {
			// For production, always use user data directory
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

			// In Electron environment for production
			if (typeof require !== "undefined") {
				try {
					const { app } = require("electron");
					const userDataPath = app.getPath("userData");
					const prodDbPath = path.join(userDataPath, "game-dict.db");
					console.log('Using production database:', prodDbPath);
					return prodDbPath;
				} catch {
					// Fallback should not happen in production
					throw new Error('Cannot determine production database path');
				}
			}
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

	private initializeTables(): void {
		// Create games table
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS games (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Migrate games table: add code column if it doesn't exist
		this.migrateGamesTable();

		// Create categories table
		this.db.exec(`
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

		// Create entries table
		this.db.exec(`
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

		// Create indexes for better performance
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_entries_game_id ON entries(game_id);
			CREATE INDEX IF NOT EXISTS idx_entries_category_id ON entries(category_id);
			CREATE INDEX IF NOT EXISTS idx_entries_reading ON entries(reading);
		`);

		this.insertDefaultCategories();
	}

	private migrateGamesTable(): void {
		// Check if code column exists
		const tableInfo = this.db.prepare("PRAGMA table_info(games)").all() as Array<{
			cid: number;
			name: string;
			type: string;
			notnull: number;
			dflt_value: any;
			pk: number;
		}>;

		const codeColumnExists = tableInfo.some(column => column.name === 'code');

		if (!codeColumnExists) {
			console.log('Adding code column to games table...');
			
			// Add code column (without NOT NULL constraint initially)
			this.db.exec('ALTER TABLE games ADD COLUMN code TEXT');
			
			// Generate codes for existing games
			const existingGames = this.db.prepare('SELECT id, name FROM games').all() as Array<{
				id: number;
				name: string;
			}>;

			if (existingGames.length > 0) {
				const updateCode = this.db.prepare('UPDATE games SET code = ? WHERE id = ?');
				
				for (const game of existingGames) {
					const existingCodes = existingGames
						.filter(g => g.id !== game.id)
						.map(g => this.generateCodeFromName(g.name))
						.filter((code): code is string => Boolean(code));
					const generatedCode = this.generateUniqueCodeFromName(game.name, existingCodes);
					updateCode.run(generatedCode, game.id);
				}
			}

			// Now add the UNIQUE constraint
			this.db.exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_games_code ON games(code);
			`);
			
			console.log('Code column migration completed.');
		}
	}

	private generateCodeFromName(name: string): string {
		if (!name) return "";
		
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "")
			.substring(0, 16);
	}

	private generateUniqueCodeFromName(name: string, existingCodes: string[]): string {
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
		const existingCategories = this.db
			.prepare("SELECT COUNT(*) as count FROM categories")
			.get() as { count: number };

		if (existingCategories.count === 0) {
			const insertCategory = this.db.prepare(`
				INSERT INTO categories (name, google_ime_name, ms_ime_name, atok_name)
				VALUES (?, ?, ?, ?)
			`);

			const defaultCategories = [
				["名詞", "一般", "一般", "一般"],
				["品詞なし", "一般", "一般", "一般"],
				["人名", "人名", "人名", "人名"],
			];

			for (const category of defaultCategories) {
				insertCategory.run(...category);
			}
		}
	}

	public getDatabase(): Database.Database {
		return this.db;
	}

	public getDbPath(): string {
		return this.dbPath;
	}

	public close(): void {
		this.db.close();
	}
}
