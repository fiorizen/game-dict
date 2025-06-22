import { DrizzleDatabase } from "./drizzle-database.js";
import type { Game, Category, Entry, EntryWithDetails, NewGame, NewEntry, NewCategory } from "../shared/types.js";
declare class DrizzleGameWrapper {
    private drizzleDb;
    constructor(drizzleDb: DrizzleDatabase);
    getAll(): Game[];
    getById(id: number): Game | null;
    create(data: NewGame): Game;
    update(id: number, data: Partial<NewGame>): Game | null;
    delete(id: number): boolean;
    getByName(name: string): Game | null;
    getByCode(code: string): Game | null;
}
declare class DrizzleCategoryWrapper {
    private drizzleDb;
    constructor(drizzleDb: DrizzleDatabase);
    getAll(): Category[];
    getById(id: number): Category | null;
    create(data: NewCategory): Category;
    update(id: number, data: Partial<NewCategory>): Category | null;
    delete(id: number): boolean;
}
declare class DrizzleEntryWrapper {
    private drizzleDb;
    constructor(drizzleDb: DrizzleDatabase);
    getAll(): Entry[];
    getAllWithDetails(): EntryWithDetails[];
    getByGameId(gameId: number): Entry[];
    getByGameIdUnsorted(gameId: number): Entry[];
    getByGameIdWithDetails(gameId: number): EntryWithDetails[];
    getById(id: number): Entry | null;
    getByIdWithDetails(id: number): EntryWithDetails | null;
    create(data: NewEntry): Entry;
    update(id: number, data: Partial<NewEntry>): Entry | null;
    delete(id: number): boolean;
    search(query: string, gameId?: number): EntryWithDetails[];
    deleteByGameId(gameId: number): number;
}
export declare class DrizzleDatabaseWrapper {
    private static instance;
    private drizzleDb;
    games: DrizzleGameWrapper;
    categories: DrizzleCategoryWrapper;
    entries: DrizzleEntryWrapper;
    private constructor();
    static getInstance(): DrizzleDatabaseWrapper;
    static resetInstance(): void;
    getDbPath(): string;
    close(): void;
    getDatabase(): any;
}
export {};
//# sourceMappingURL=drizzle-wrapper.d.ts.map