import { DrizzleDatabase } from "./drizzle-database.js";
import { type DrizzleCategoryWrapper, type DrizzleEntryWrapper, type DrizzleGameWrapper } from "./drizzle-wrapper.js";
export declare class Database {
    private static instance;
    private wrapper;
    games: DrizzleGameWrapper;
    categories: DrizzleCategoryWrapper;
    entries: DrizzleEntryWrapper;
    private constructor();
    static getInstance(): Database;
    static resetInstance(): void;
    getDbPath(): string;
    getDatabase(): import("better-sqlite3").Database;
    close(): void;
}
export { DrizzleDatabase };
export * from "../shared/types.js";
export * from "./models/category.js";
export * from "./models/entry.js";
export * from "./models/game.js";
//# sourceMappingURL=index.d.ts.map