import { eq, and, or, like, sql, asc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Entry, NewEntry, EntryWithDetails } from "../schema.js";

export class DrizzleEntryModel {
	private db: BetterSQLite3Database<typeof schema>;

	constructor(db: BetterSQLite3Database<typeof schema>) {
		this.db = db;
	}

	public getAll(): Entry[] {
		return this.db
			.select()
			.from(schema.entries)
			.orderBy(asc(schema.entries.reading))
			.all();
	}

	public getAllWithDetails(): EntryWithDetails[] {
		const results = this.db
			.select({
				id: schema.entries.id,
				gameId: schema.entries.gameId,
				categoryId: schema.entries.categoryId,
				reading: schema.entries.reading,
				word: schema.entries.word,
				description: schema.entries.description,
				createdAt: schema.entries.createdAt,
				updatedAt: schema.entries.updatedAt,
				gameName: schema.games.name,
				categoryName: schema.categories.name,
			})
			.from(schema.entries)
			.innerJoin(schema.games, eq(schema.entries.gameId, schema.games.id))
			.innerJoin(schema.categories, eq(schema.entries.categoryId, schema.categories.id))
			.orderBy(asc(schema.entries.reading))
			.all();

		return results;
	}

	public getByGameId(gameId: number): Entry[] {
		return this.db
			.select()
			.from(schema.entries)
			.where(eq(schema.entries.gameId, gameId))
			.orderBy(asc(schema.entries.reading))
			.all();
	}

	public getByGameIdUnsorted(gameId: number): Entry[] {
		return this.db
			.select()
			.from(schema.entries)
			.where(eq(schema.entries.gameId, gameId))
			.orderBy(asc(schema.entries.id))
			.all();
	}

	public getByGameIdWithDetails(gameId: number): EntryWithDetails[] {
		const results = this.db
			.select({
				id: schema.entries.id,
				gameId: schema.entries.gameId,
				categoryId: schema.entries.categoryId,
				reading: schema.entries.reading,
				word: schema.entries.word,
				description: schema.entries.description,
				createdAt: schema.entries.createdAt,
				updatedAt: schema.entries.updatedAt,
				gameName: schema.games.name,
				categoryName: schema.categories.name,
			})
			.from(schema.entries)
			.innerJoin(schema.games, eq(schema.entries.gameId, schema.games.id))
			.innerJoin(schema.categories, eq(schema.entries.categoryId, schema.categories.id))
			.where(eq(schema.entries.gameId, gameId))
			.orderBy(asc(schema.entries.reading))
			.all();

		return results;
	}

	public getById(id: number): Entry | null {
		const results = this.db
			.select()
			.from(schema.entries)
			.where(eq(schema.entries.id, id))
			.limit(1)
			.all();
		
		return results[0] || null;
	}

	public getByIdWithDetails(id: number): EntryWithDetails | null {
		const results = this.db
			.select({
				id: schema.entries.id,
				gameId: schema.entries.gameId,
				categoryId: schema.entries.categoryId,
				reading: schema.entries.reading,
				word: schema.entries.word,
				description: schema.entries.description,
				createdAt: schema.entries.createdAt,
				updatedAt: schema.entries.updatedAt,
				gameName: schema.games.name,
				categoryName: schema.categories.name,
			})
			.from(schema.entries)
			.innerJoin(schema.games, eq(schema.entries.gameId, schema.games.id))
			.innerJoin(schema.categories, eq(schema.entries.categoryId, schema.categories.id))
			.where(eq(schema.entries.id, id))
			.limit(1)
			.all();

		return results[0] || null;
	}

	public create(data: Omit<NewEntry, "id" | "createdAt" | "updatedAt">): Entry {
		const now = new Date().toISOString();
		const result = this.db
			.insert(schema.entries)
			.values({
				...data,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
			.all();

		return result[0];
	}

	public update(id: number, data: Partial<Omit<NewEntry, "id" | "createdAt">>): Entry | null {
		if (Object.keys(data).length === 0) {
			return this.getById(id);
		}

		const now = new Date().toISOString();
		const result = this.db
			.update(schema.entries)
			.set({
				...data,
				updatedAt: now,
			})
			.where(eq(schema.entries.id, id))
			.returning()
			.all();

		return result[0] || null;
	}

	public delete(id: number): boolean {
		const result = this.db
			.delete(schema.entries)
			.where(eq(schema.entries.id, id))
			.run();

		return result.changes > 0;
	}

	public search(query: string, gameId?: number): EntryWithDetails[] {
		const searchCondition = or(
			like(schema.entries.reading, `%${query}%`),
			like(schema.entries.word, `%${query}%`),
			like(schema.entries.description, `%${query}%`)
		);

		const whereCondition = gameId 
			? and(searchCondition, eq(schema.entries.gameId, gameId))
			: searchCondition;

		const results = this.db
			.select({
				id: schema.entries.id,
				gameId: schema.entries.gameId,
				categoryId: schema.entries.categoryId,
				reading: schema.entries.reading,
				word: schema.entries.word,
				description: schema.entries.description,
				createdAt: schema.entries.createdAt,
				updatedAt: schema.entries.updatedAt,
				gameName: schema.games.name,
				categoryName: schema.categories.name,
			})
			.from(schema.entries)
			.innerJoin(schema.games, eq(schema.entries.gameId, schema.games.id))
			.innerJoin(schema.categories, eq(schema.entries.categoryId, schema.categories.id))
			.where(whereCondition)
			.orderBy(asc(schema.entries.reading))
			.all();

		return results;
	}

	public deleteByGameId(gameId: number): number {
		const result = this.db
			.delete(schema.entries)
			.where(eq(schema.entries.gameId, gameId))
			.run();

		return result.changes;
	}

	public count(): number {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.entries)
			.all();
		
		return result[0].count;
	}

	public countByGameId(gameId: number): number {
		const result = this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.entries)
			.where(eq(schema.entries.gameId, gameId))
			.all();
		
		return result[0].count;
	}
}