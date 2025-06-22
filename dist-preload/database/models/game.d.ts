import type { Database } from "better-sqlite3";
import type { Game, NewGame } from "../../shared/types.js";
export declare class GameModel {
    private db;
    constructor(db: Database);
    getAll(): Game[];
    getById(id: number): Game | null;
    create(game: NewGame): Game;
    update(id: number, updates: Partial<NewGame>): Game | null;
    delete(id: number): boolean;
    getByName(name: string): Game | null;
    getByCode(code: string): Game | null;
}
//# sourceMappingURL=game.d.ts.map