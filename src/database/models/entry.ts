import type { Database } from "better-sqlite3";
import type { Entry, EntryWithDetails, NewEntry } from "../../shared/types.js";

export class EntryModel {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	public getAll(): Entry[] {
		const stmt = this.db.prepare("SELECT * FROM entries ORDER BY reading ASC");
		return stmt.all() as Entry[];
	}

	public getAllWithDetails(): EntryWithDetails[] {
		const stmt = this.db.prepare(`
			SELECT 
				e.*,
				g.name as game_name,
				c.name as category_name
			FROM entries e
			JOIN games g ON e.game_id = g.id
			JOIN categories c ON e.category_id = c.id
			ORDER BY e.reading ASC
		`);
		return stmt.all() as EntryWithDetails[];
	}

	public getByGameId(gameId: number): Entry[] {
		const stmt = this.db.prepare(
			"SELECT * FROM entries WHERE game_id = ? ORDER BY reading ASC",
		);
		return stmt.all(gameId) as Entry[];
	}

	public getByGameIdWithDetails(gameId: number): EntryWithDetails[] {
		const stmt = this.db.prepare(`
			SELECT 
				e.*,
				g.name as game_name,
				c.name as category_name
			FROM entries e
			JOIN games g ON e.game_id = g.id
			JOIN categories c ON e.category_id = c.id
			WHERE e.game_id = ?
			ORDER BY e.reading ASC
		`);
		return stmt.all(gameId) as EntryWithDetails[];
	}

	public getById(id: number): Entry | null {
		const stmt = this.db.prepare("SELECT * FROM entries WHERE id = ?");
		return (stmt.get(id) as Entry) || null;
	}

	public getByIdWithDetails(id: number): EntryWithDetails | null {
		const stmt = this.db.prepare(`
			SELECT 
				e.*,
				g.name as game_name,
				c.name as category_name
			FROM entries e
			JOIN games g ON e.game_id = g.id
			JOIN categories c ON e.category_id = c.id
			WHERE e.id = ?
		`);
		return (stmt.get(id) as EntryWithDetails) || null;
	}

	public create(entry: NewEntry): Entry {
		const stmt = this.db.prepare(`
			INSERT INTO entries (game_id, category_id, reading, word, description, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
		`);
		const result = stmt.run(
			entry.game_id,
			entry.category_id,
			entry.reading,
			entry.word,
			entry.description || null,
		);
		const insertedId = result.lastInsertRowid as number;
		const created = this.getById(insertedId);
		if (!created) {
			throw new Error("Failed to create entry");
		}
		return created;
	}

	public update(id: number, updates: Partial<NewEntry>): Entry | null {
		if (Object.keys(updates).length === 0) {
			return this.getById(id);
		}

		const setClause = Object.keys(updates)
			.map((key) => `${key} = ?`)
			.join(", ");

		const stmt = this.db.prepare(`
			UPDATE entries 
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
		const stmt = this.db.prepare("DELETE FROM entries WHERE id = ?");
		const result = stmt.run(id);
		return result.changes > 0;
	}

	public search(query: string, gameId?: number): EntryWithDetails[] {
		let sql = `
			SELECT 
				e.*,
				g.name as game_name,
				c.name as category_name
			FROM entries e
			JOIN games g ON e.game_id = g.id
			JOIN categories c ON e.category_id = c.id
			WHERE (e.reading LIKE ? OR e.word LIKE ? OR e.description LIKE ?)
		`;
		const params = [`%${query}%`, `%${query}%`, `%${query}%`];

		if (gameId) {
			sql += " AND e.game_id = ?";
			params.push(gameId.toString());
		}

		sql += " ORDER BY e.reading ASC";

		const stmt = this.db.prepare(sql);
		return stmt.all(...params) as EntryWithDetails[];
	}

	public deleteByGameId(gameId: number): number {
		const stmt = this.db.prepare("DELETE FROM entries WHERE game_id = ?");
		const result = stmt.run(gameId);
		return result.changes;
	}
}
