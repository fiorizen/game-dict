import type { Database } from "better-sqlite3";
import type { Game, NewGame } from "../../shared/types.js";

export class GameModel {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	public getAll(): Game[] {
		const stmt = this.db.prepare("SELECT * FROM games ORDER BY name ASC");
		return stmt.all() as Game[];
	}

	public getById(id: number): Game | null {
		const stmt = this.db.prepare("SELECT * FROM games WHERE id = ?");
		return (stmt.get(id) as Game) || null;
	}

	public create(game: NewGame): Game {
		const stmt = this.db.prepare(`
			INSERT INTO games (name, created_at, updated_at)
			VALUES (?, datetime('now'), datetime('now'))
		`);
		const result = stmt.run(game.name);
		const insertedId = result.lastInsertRowid as number;
		const created = this.getById(insertedId);
		if (!created) {
			throw new Error("Failed to create game");
		}
		return created;
	}

	public update(id: number, updates: Partial<NewGame>): Game | null {
		if (Object.keys(updates).length === 0) {
			return this.getById(id);
		}

		const setClause = Object.keys(updates)
			.map((key) => `${key} = ?`)
			.join(", ");

		const stmt = this.db.prepare(`
			UPDATE games 
			SET ${setClause}, updated_at = datetime('now')
			WHERE id = ?
		`);

		const values = [...Object.values(updates), id];
		const result = stmt.run(...values);

		if (result.changes === 0) {
			return null;
		}

		return this.getById(id);
	}

	public delete(id: number): boolean {
		const stmt = this.db.prepare("DELETE FROM games WHERE id = ?");
		const result = stmt.run(id);
		return result.changes > 0;
	}

	public getByName(name: string): Game | null {
		const stmt = this.db.prepare("SELECT * FROM games WHERE name = ?");
		return (stmt.get(name) as Game) || null;
	}
}
