import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export class DatabaseConnection {
	private static instance: DatabaseConnection;
	private db: Database.Database;

	private constructor() {
		const dbPath = this.getDatabasePath();

		// Ensure directory exists
		const dbDir = path.dirname(dbPath);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		this.db = new Database(dbPath);
		this.db.pragma("foreign_keys = ON");
		this.initializeTables();
	}

	public static getInstance(): DatabaseConnection {
		if (!DatabaseConnection.instance) {
			DatabaseConnection.instance = new DatabaseConnection();
		}
		return DatabaseConnection.instance;
	}

	private getDatabasePath(): string {
		// For testing environment, check if app is available
		if (
			typeof global !== "undefined" &&
			(global as { app?: { getPath: (path: string) => string } }).app
		) {
			const userDataPath = (
				global as { app: { getPath: (path: string) => string } }
			).app.getPath("userData");
			return path.join(userDataPath, "game-dict.db");
		}

		// In Electron environment
		if (typeof require !== "undefined") {
			try {
				const { app } = require("electron");
				const userDataPath = app.getPath("userData");
				return path.join(userDataPath, "game-dict.db");
			} catch {
				// Fallback for non-Electron environment
				return path.join(process.cwd(), "test-data", "game-dict.db");
			}
		}

		// Default fallback
		return path.join(process.cwd(), "test-data", "game-dict.db");
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
				["人名", "人名", "人名", "人名"],
				["地名", "地名", "地名", "地名"],
				["技名・スキル", "一般", "短縮よみ", "固有名詞"],
				["アイテム", "一般", "一般", "一般"],
				["モンスター", "一般", "一般", "固有名詞"],
				["組織・団体", "一般", "一般", "固有名詞"],
			];

			for (const category of defaultCategories) {
				insertCategory.run(...category);
			}
		}
	}

	public getDatabase(): Database.Database {
		return this.db;
	}

	public close(): void {
		this.db.close();
	}
}
