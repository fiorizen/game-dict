import type { Database } from "better-sqlite3";
import type { Game, NewGame } from "../../shared/types.js";
import { validateGameCode } from "../../shared/validation.js";

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
		// Validate code
		const validation = validateGameCode(game.code);
		if (!validation.valid) {
			throw new Error(`Invalid game code: ${validation.error}`);
		}

		// Check if code already exists
		const existingGame = this.getByCode(game.code);
		if (existingGame) {
			throw new Error(`Game code '${game.code}' already exists`);
		}

		const stmt = this.db.prepare(`
			INSERT INTO games (name, code, created_at, updated_at)
			VALUES (?, ?, datetime('now'), datetime('now'))
		`);
		const result = stmt.run(game.name, game.code);
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

		// Validate code if being updated
		if (updates.code) {
			const validation = validateGameCode(updates.code);
			if (!validation.valid) {
				throw new Error(`Invalid game code: ${validation.error}`);
			}

			// Check if code already exists (excluding current game)
			const existingGame = this.getByCode(updates.code);
			if (existingGame && existingGame.id !== id) {
				throw new Error(`Game code '${updates.code}' already exists`);
			}
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

	public getByCode(code: string): Game | null {
		const stmt = this.db.prepare("SELECT * FROM games WHERE code = ?");
		return (stmt.get(code) as Game) || null;
	}
}
