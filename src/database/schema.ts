import { sql } from "drizzle-orm";
import { integer, text, sqliteTable, index } from "drizzle-orm/sqlite-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Games table
export const games = sqliteTable("games", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Categories table
export const categories = sqliteTable("categories", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	googleImeName: text("google_ime_name"),
	msImeName: text("ms_ime_name"),
	atokName: text("atok_name"),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Entries table
export const entries = sqliteTable("entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
	categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
	reading: text("reading").notNull(),
	word: text("word").notNull(),
	description: text("description"),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
	gameIdIdx: index("idx_entries_game_id").on(table.gameId),
	categoryIdIdx: index("idx_entries_category_id").on(table.categoryId),
	readingIdx: index("idx_entries_reading").on(table.reading),
}));

// Type definitions
export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Entry = InferSelectModel<typeof entries>;
export type NewEntry = InferInsertModel<typeof entries>;

// Combined type for entries with details
export type EntryWithDetails = Entry & {
	gameName: string;
	categoryName: string;
};