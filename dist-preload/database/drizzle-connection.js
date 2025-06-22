"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleConnection = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("./schema.js"));
class DrizzleConnection {
    constructor() {
        this.dbPath = this.getDatabasePath();
        // Ensure directory exists
        const dbDir = node_path_1.default.dirname(this.dbPath);
        if (!node_fs_1.default.existsSync(dbDir)) {
            node_fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        this.sqlite = new better_sqlite3_1.default(this.dbPath);
        this.sqlite.pragma("foreign_keys = ON");
        this.db = (0, better_sqlite3_2.drizzle)(this.sqlite, { schema });
        this.initializeDatabase();
    }
    static getInstance() {
        if (!DrizzleConnection.instance) {
            DrizzleConnection.instance = new DrizzleConnection();
        }
        return DrizzleConnection.instance;
    }
    static resetInstance() {
        if (DrizzleConnection.instance) {
            try {
                DrizzleConnection.instance.close();
            }
            catch {
                // Ignore errors during close
            }
        }
        DrizzleConnection.instance = undefined;
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
    initializeDatabase() {
        // Run migrations if available
        try {
            const migrationsPath = node_path_1.default.join(process.cwd(), "migrations");
            if (node_fs_1.default.existsSync(migrationsPath)) {
                (0, migrator_1.migrate)(this.db, { migrationsFolder: migrationsPath });
            }
            else {
                // No migrations found, create tables manually
                this.createTablesManually();
            }
        }
        catch (error) {
            console.warn("Migration failed, falling back to manual table creation:", error);
            this.createTablesManually();
        }
        // Insert default categories
        this.insertDefaultCategories();
    }
    createTablesManually() {
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
    insertDefaultCategories() {
        const existingCategories = this.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
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
    getDatabase() {
        return this.db;
    }
    getSqlite() {
        return this.sqlite;
    }
    getDbPath() {
        return this.dbPath;
    }
    close() {
        this.sqlite.close();
    }
}
exports.DrizzleConnection = DrizzleConnection;
//# sourceMappingURL=drizzle-connection.js.map