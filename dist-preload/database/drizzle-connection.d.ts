import Database from "better-sqlite3";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
export declare class DrizzleConnection {
    private static instance;
    private db;
    private sqlite;
    private dbPath;
    private constructor();
    static getInstance(): DrizzleConnection;
    static resetInstance(): void;
    private getDatabasePath;
    private initializeDatabase;
    private createTablesManually;
    private migrateGamesTable;
    private generateCodeFromName;
    private generateUniqueCodeFromName;
    private insertDefaultCategories;
    getDatabase(): BetterSQLite3Database<typeof schema>;
    getSqlite(): Database.Database;
    getDbPath(): string;
    close(): void;
}
//# sourceMappingURL=drizzle-connection.d.ts.map