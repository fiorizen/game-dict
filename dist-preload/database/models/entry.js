"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryModel = void 0;
class EntryModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        const stmt = this.db.prepare("SELECT * FROM entries ORDER BY reading ASC");
        return stmt.all();
    }
    getAllWithDetails() {
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
        return stmt.all();
    }
    getByGameId(gameId) {
        const stmt = this.db.prepare("SELECT * FROM entries WHERE game_id = ? ORDER BY reading ASC");
        return stmt.all(gameId);
    }
    getByGameIdUnsorted(gameId) {
        const stmt = this.db.prepare("SELECT * FROM entries WHERE game_id = ? ORDER BY id ASC");
        return stmt.all(gameId);
    }
    getByGameIdWithDetails(gameId) {
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
        return stmt.all(gameId);
    }
    getById(id) {
        const stmt = this.db.prepare("SELECT * FROM entries WHERE id = ?");
        return stmt.get(id) || null;
    }
    getByIdWithDetails(id) {
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
        return stmt.get(id) || null;
    }
    create(entry) {
        const stmt = this.db.prepare(`
			INSERT INTO entries (game_id, category_id, reading, word, description, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
		`);
        const result = stmt.run(entry.game_id, entry.category_id, entry.reading, entry.word, entry.description || null);
        const insertedId = result.lastInsertRowid;
        const created = this.getById(insertedId);
        if (!created) {
            throw new Error("Failed to create entry");
        }
        return created;
    }
    update(id, updates) {
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
    delete(id) {
        const stmt = this.db.prepare("DELETE FROM entries WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }
    search(query, gameId) {
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
        return stmt.all(...params);
    }
    deleteByGameId(gameId) {
        const stmt = this.db.prepare("DELETE FROM entries WHERE game_id = ?");
        const result = stmt.run(gameId);
        return result.changes;
    }
}
exports.EntryModel = EntryModel;
//# sourceMappingURL=entry.js.map