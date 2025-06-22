import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Category, NewCategory } from "../schema.js";

export class DrizzleCategoryModel {
	private db: BetterSQLite3Database<typeof schema>;

	constructor(db: BetterSQLite3Database<typeof schema>) {
		this.db = db;
	}

	public getAll(): Category[] {
		return this.db
			.select()
			.from(schema.categories)
			.orderBy(schema.categories.name)
		.all();
	}

	public getById(id: number): Category | null {
		const results = this.db
			.select()
			.from(schema.categories)
			.where(eq(schema.categories.id, id))
			.limit(1)
		.all();
		
		return results[0] || null;
	}

	public create(data: Omit<NewCategory, "id" | "createdAt" | "updatedAt">): Category {
		const now = new Date().toISOString();
		const result = this.db
			.insert(schema.categories)
			.values({
				...data,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
		.all();

		return result[0];
	}

	public update(id: number, data: Partial<Omit<NewCategory, "id" | "createdAt">>): Category | null {
		if (Object.keys(data).length === 0) {
			return this.getById(id);
		}

		const now = new Date().toISOString();
		const result = this.db
			.update(schema.categories)
			.set({
				...data,
				updatedAt: now,
			})
			.where(eq(schema.categories.id, id))
			.returning()
		.all();

		return result[0] || null;
	}

	public delete(id: number): boolean {
		const result = this.db
			.delete(schema.categories)
			.where(eq(schema.categories.id, id))
			.run();

		return result.changes > 0;
	}

	public findByName(name: string): Category | null {
		const results = this.db
			.select()
			.from(schema.categories)
			.where(eq(schema.categories.name, name))
			.limit(1)
		.all();
		
		return results[0] || null;
	}

	public count(): number {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.categories)
			.all();
		
		return result[0].count;
	}
}