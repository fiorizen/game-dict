import { DrizzleConnection } from "./drizzle-connection.js";
import { DrizzleGameModel } from "./models/drizzle-game.js";
import { DrizzleCategoryModel } from "./models/drizzle-category.js";
import { DrizzleEntryModel } from "./models/drizzle-entry.js";
export declare class DrizzleDatabase {
    private static instance;
    private connection;
    games: DrizzleGameModel;
    categories: DrizzleCategoryModel;
    entries: DrizzleEntryModel;
    private constructor();
    static getInstance(): DrizzleDatabase;
    static resetInstance(): void;
    getDbPath(): string;
    close(): void;
    getConnection(): DrizzleConnection;
}
//# sourceMappingURL=drizzle-database.d.ts.map