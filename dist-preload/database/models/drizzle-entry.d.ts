import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Entry, NewEntry, EntryWithDetails } from "../schema.js";
export declare class DrizzleEntryModel {
    private db;
    constructor(db: BetterSQLite3Database<typeof schema>);
    getAll(): Entry[];
    getAllWithDetails(): EntryWithDetails[];
    getByGameId(gameId: number): Entry[];
    getByGameIdUnsorted(gameId: number): Entry[];
    getByGameIdWithDetails(gameId: number): EntryWithDetails[];
    getById(id: number): Entry | null;
    getByIdWithDetails(id: number): EntryWithDetails | null;
    create(data: Omit<NewEntry, "id" | "createdAt" | "updatedAt">): Entry;
    update(id: number, data: Partial<Omit<NewEntry, "id" | "createdAt">>): Entry | null;
    delete(id: number): boolean;
    search(query: string, gameId?: number): EntryWithDetails[];
    deleteByGameId(gameId: number): number;
    count(): number;
    countByGameId(gameId: number): number;
}
//# sourceMappingURL=drizzle-entry.d.ts.map