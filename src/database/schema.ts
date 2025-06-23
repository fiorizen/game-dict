import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Games table
export const games = sqliteTable(
	"games",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull().unique(),
		code: text("code").notNull().unique(),
		createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		// name と code は既に unique制約があるが、検索パフォーマンス向上のためインデックス追加
		nameIdx: index("idx_games_name").on(table.name),
		codeIdx: index("idx_games_code").on(table.code),
	}),
);

// Categories table
export const categories = sqliteTable(
	"categories",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull().unique(),
		googleImeName: text("google_ime_name"),
		msImeName: text("ms_ime_name"),
		atokName: text("atok_name"),
		createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		// カテゴリ名での検索パフォーマンス向上
		nameIdx: index("idx_categories_name").on(table.name),
	}),
);

// Entries table
export const entries = sqliteTable(
	"entries",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		gameId: integer("game_id")
			.notNull()
			.references(() => games.id, { onDelete: "cascade" }),
		categoryId: integer("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		reading: text("reading").notNull(),
		word: text("word").notNull(),
		description: text("description"),
		createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		gameIdIdx: index("idx_entries_game_id").on(table.gameId),
		categoryIdIdx: index("idx_entries_category_id").on(table.categoryId),
		readingIdx: index("idx_entries_reading").on(table.reading),

		// 複合インデックス - 検索パフォーマンス最適化
		gameReadingIdx: index("idx_entries_game_reading").on(
			table.gameId,
			table.reading,
		),
		readingWordIdx: index("idx_entries_reading_word").on(
			table.reading,
			table.word,
		),
		gameWordIdx: index("idx_entries_game_word").on(table.gameId, table.word),

		// 重複チェック用複合インデックス
		gameReadingWordIdx: index("idx_entries_game_reading_word").on(
			table.gameId,
			table.reading,
			table.word,
		),
	}),
);

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
