import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Game, NewGame } from "../schema.js";
export declare class DrizzleGameModel {
    private db;
    constructor(db: BetterSQLite3Database<typeof schema>);
    getAll(): Game[];
    getById(id: number): Game | null;
    create(data: Omit<NewGame, "id" | "createdAt" | "updatedAt">): Game;
    update(id: number, data: Partial<Omit<NewGame, "id" | "createdAt">>): Game | null;
    delete(id: number): boolean;
    findByName(name: string): Game | null;
    getByName(name: string): Game | null;
    getByCode(code: string): Game | null;
    getRecentGames(limit?: number): Game[];
    count(): number;
    deleteWithRelatedEntries(id: number): {
        deletedGame: boolean;
        deletedEntries: number;
    };
    getEntryCount(id: number): number;
}
//# sourceMappingURL=drizzle-game.d.ts.map