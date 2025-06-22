"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModel = void 0;
class GameModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        const stmt = this.db.prepare("SELECT * FROM games ORDER BY name ASC");
        return stmt.all();
    }
    getById(id) {
        const stmt = this.db.prepare("SELECT * FROM games WHERE id = ?");
        return stmt.get(id) || null;
    }
    create(game) {
        const stmt = this.db.prepare(`
			INSERT INTO games (name, created_at, updated_at)
			VALUES (?, datetime('now'), datetime('now'))
		`);
        const result = stmt.run(game.name);
        const insertedId = result.lastInsertRowid;
        const created = this.getById(insertedId);
        if (!created) {
            throw new Error("Failed to create game");
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
    delete(id) {
        const stmt = this.db.prepare("DELETE FROM games WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }
    getByName(name) {
        const stmt = this.db.prepare("SELECT * FROM games WHERE name = ?");
        return stmt.get(name) || null;
    }
}
exports.GameModel = GameModel;
//# sourceMappingURL=game.js.map