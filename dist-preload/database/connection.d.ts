import Database from "better-sqlite3";
export declare class DatabaseConnection {
    private static instance;
    private db;
    private dbPath;
    private constructor();
    static getInstance(): DatabaseConnection;
    static resetInstance(): void;
    private getDatabasePath;
    private initializeTables;
    private insertDefaultCategories;
    getDatabase(): Database.Database;
    getDbPath(): string;
    close(): void;
}
//# sourceMappingURL=connection.d.ts.map