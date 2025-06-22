import { eq, sql, desc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Game, NewGame } from "../schema.js";

export class DrizzleGameModel {
	private db: BetterSQLite3Database<typeof schema>;

	constructor(db: BetterSQLite3Database<typeof schema>) {
		this.db = db;
	}

	public getAll(): Game[] {
		return this.db
			.select()
			.from(schema.games)
			.orderBy(schema.games.name)
			.all();
	}

	public getById(id: number): Game | null {
		const results = this.db
			.select()
			.from(schema.games)
			.where(eq(schema.games.id, id))
			.limit(1)
			.all();
		
		return results[0] || null;
	}

	public create(data: Omit<NewGame, "id" | "createdAt" | "updatedAt">): Game {
		const now = new Date().toISOString();
		const result = this.db
			.insert(schema.games)
			.values({
				...data,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
			.all();

		return result[0];
	}

	public update(id: number, data: Partial<Omit<NewGame, "id" | "createdAt">>): Game | null {
		if (Object.keys(data).length === 0) {
			return this.getById(id);
		}

		const now = new Date().toISOString();
		const result = this.db
			.update(schema.games)
			.set({
				...data,
				updatedAt: now,
			})
			.where(eq(schema.games.id, id))
			.returning()
		.all();

		return result[0] || null;
	}

	public delete(id: number): boolean {
		const result = this.db
			.delete(schema.games)
			.where(eq(schema.games.id, id))
			.run();

		return result.changes > 0;
	}

	public findByName(name: string): Game | null {
		const results = this.db
			.select()
			.from(schema.games)
			.where(eq(schema.games.name, name))
			.limit(1)
			.all();
		
		return results[0] || null;
	}

	public getRecentGames(limit: number = 10): Game[] {
		return this.db
			.select()
			.from(schema.games)
			.orderBy(desc(schema.games.updatedAt))
			.limit(limit)
			.all();
	}

	public count(): number {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.games)
			.all();
		
		return result[0].count;
	}
}