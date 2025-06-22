"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
class CategoryModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        const stmt = this.db.prepare("SELECT * FROM categories ORDER BY name ASC");
        return stmt.all();
    }
    getById(id) {
        const stmt = this.db.prepare("SELECT * FROM categories WHERE id = ?");
        return stmt.get(id) || null;
    }
    create(category) {
        const stmt = this.db.prepare(`
			INSERT INTO categories (name, google_ime_name, ms_ime_name, atok_name, created_at, updated_at)
			VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
		`);
        const result = stmt.run(category.name, category.google_ime_name || null, category.ms_ime_name || null, category.atok_name || null);
        const insertedId = result.lastInsertRowid;
        const created = this.getById(insertedId);
        if (!created) {
            throw new Error("Failed to create category");
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
			UPDATE categories 
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
        const stmt = this.db.prepare("DELETE FROM categories WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }
    getByName(name) {
        const stmt = this.db.prepare("SELECT * FROM categories WHERE name = ?");
        return stmt.get(name) || null;
    }
}
exports.CategoryModel = CategoryModel;
//# sourceMappingURL=category.js.map