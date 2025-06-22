"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class DatabaseConnection {
    constructor() {
        this.dbPath = this.getDatabasePath();
        // Ensure directory exists
        const dbDir = node_path_1.default.dirname(this.dbPath);
        if (!node_fs_1.default.existsSync(dbDir)) {
            node_fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(this.dbPath);
        this.db.pragma("foreign_keys = ON");
        this.initializeTables();
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    static resetInstance() {
        if (DatabaseConnection.instance) {
            try {
                DatabaseConnection.instance.close();
            }
            catch {
                // Ignore errors during close
            }
        }
        DatabaseConnection.instance = undefined;
    }
    getDatabasePath() {
        // テスト環境の判定（環境変数優先）
        const isTestEnv = process.env.NODE_ENV === 'test' ||
            process.env.VITEST === 'true';
        if (isTestEnv) {
            // テスト環境では専用のパスを使用
            const testDbPath = node_path_1.default.join(process.cwd(), "test-data", "game-dict-test.db");
            console.log('Using test database:', testDbPath);
            return testDbPath;
        }
        // For testing environment, check if app is available
        if (typeof global !== "undefined" &&
            global.app) {
            const globalWithApp = global;
            const userDataPath = globalWithApp.app.getPath("userData");
            const prodDbPath = node_path_1.default.join(userDataPath, "game-dict.db");
            console.log('Using production database:', prodDbPath);
            return prodDbPath;
        }
        // In Electron environment
        if (typeof require !== "undefined") {
            try {
                const { app } = require("electron");
                const userDataPath = app.getPath("userData");
                const prodDbPath = node_path_1.default.join(userDataPath, "game-dict.db");
                console.log('Using production database:', prodDbPath);
                return prodDbPath;
            }
            catch {
                // Fallback for non-Electron environment
                const fallbackDbPath = node_path_1.default.join(process.cwd(), "test-data", "game-dict.db");
                console.log('Using fallback database:', fallbackDbPath);
                return fallbackDbPath;
            }
        }
        // Default fallback
        const defaultDbPath = node_path_1.default.join(process.cwd(), "test-data", "game-dict.db");
        console.log('Using default database:', defaultDbPath);
        return defaultDbPath;
    }
    initializeTables() {
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
    insertDefaultCategories() {
        const existingCategories = this.db
            .prepare("SELECT COUNT(*) as count FROM categories")
            .get();
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
    getDatabase() {
        return this.db;
    }
    getDbPath() {
        return this.dbPath;
    }
    close() {
        this.db.close();
    }
}
exports.DatabaseConnection = DatabaseConnection;
//# sourceMappingURL=connection.js.map