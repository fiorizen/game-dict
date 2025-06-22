import type { Database } from "better-sqlite3";
import type { Entry, EntryWithDetails, NewEntry } from "../../shared/types.js";
export declare class EntryModel {
    private db;
    constructor(db: Database);
    getAll(): Entry[];
    getAllWithDetails(): EntryWithDetails[];
    getByGameId(gameId: number): Entry[];
    getByGameIdUnsorted(gameId: number): Entry[];
    getByGameIdWithDetails(gameId: number): EntryWithDetails[];
    getById(id: number): Entry | null;
    getByIdWithDetails(id: number): EntryWithDetails | null;
    create(entry: NewEntry): Entry;
    update(id: number, updates: Partial<NewEntry>): Entry | null;
    delete(id: number): boolean;
    search(query: string, gameId?: number): EntryWithDetails[];
    deleteByGameId(gameId: number): number;
}
//# sourceMappingURL=entry.d.ts.map