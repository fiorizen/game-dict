import type { Database } from "better-sqlite3";
import type { Category, NewCategory } from "../../shared/types.js";

export class CategoryModel {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	public getAll(): Category[] {
		const stmt = this.db.prepare("SELECT * FROM categories ORDER BY name ASC");
		return stmt.all() as Category[];
	}

	public getById(id: number): Category | null {
		const stmt = this.db.prepare("SELECT * FROM categories WHERE id = ?");
		return (stmt.get(id) as Category) || null;
	}

	public create(category: NewCategory): Category {
		const stmt = this.db.prepare(`
			INSERT INTO categories (name, google_ime_name, ms_ime_name, atok_name, created_at, updated_at)
			VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
		`);
		const result = stmt.run(
			category.name,
			category.google_ime_name || null,
			category.ms_ime_name || null,
			category.atok_name || null,
		);
		const insertedId = result.lastInsertRowid as number;
		const created = this.getById(insertedId);
		if (!created) {
			throw new Error("Failed to create category");
		}
		return created;
	}

	public update(id: number, updates: Partial<NewCategory>): Category | null {
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

	public delete(id: number): boolean {
		const stmt = this.db.prepare("DELETE FROM categories WHERE id = ?");
		const result = stmt.run(id);
		return result.changes > 0;
	}

	public getByName(name: string): Category | null {
		const stmt = this.db.prepare("SELECT * FROM categories WHERE name = ?");
		return (stmt.get(name) as Category) || null;
	}
}
