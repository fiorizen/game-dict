"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entries = exports.categories = exports.games = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Games table
exports.games = (0, sqlite_core_1.sqliteTable)("games", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull().unique(),
    code: (0, sqlite_core_1.text)("code").notNull().unique(),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => ({
    // name と code は既に unique制約があるが、検索パフォーマンス向上のためインデックス追加
    nameIdx: (0, sqlite_core_1.index)("idx_games_name").on(table.name),
    codeIdx: (0, sqlite_core_1.index)("idx_games_code").on(table.code),
}));
// Categories table
exports.categories = (0, sqlite_core_1.sqliteTable)("categories", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull().unique(),
    googleImeName: (0, sqlite_core_1.text)("google_ime_name"),
    msImeName: (0, sqlite_core_1.text)("ms_ime_name"),
    atokName: (0, sqlite_core_1.text)("atok_name"),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => ({
    // カテゴリ名での検索パフォーマンス向上
    nameIdx: (0, sqlite_core_1.index)("idx_categories_name").on(table.name),
}));
// Entries table
exports.entries = (0, sqlite_core_1.sqliteTable)("entries", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    gameId: (0, sqlite_core_1.integer)("game_id")
        .notNull()
        .references(() => exports.games.id, { onDelete: "cascade" }),
    categoryId: (0, sqlite_core_1.integer)("category_id")
        .notNull()
        .references(() => exports.categories.id, { onDelete: "restrict" }),
    reading: (0, sqlite_core_1.text)("reading").notNull(),
    word: (0, sqlite_core_1.text)("word").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => ({
    gameIdIdx: (0, sqlite_core_1.index)("idx_entries_game_id").on(table.gameId),
    categoryIdIdx: (0, sqlite_core_1.index)("idx_entries_category_id").on(table.categoryId),
    readingIdx: (0, sqlite_core_1.index)("idx_entries_reading").on(table.reading),
    // 複合インデックス - 検索パフォーマンス最適化
    gameReadingIdx: (0, sqlite_core_1.index)("idx_entries_game_reading").on(table.gameId, table.reading),
    readingWordIdx: (0, sqlite_core_1.index)("idx_entries_reading_word").on(table.reading, table.word),
    gameWordIdx: (0, sqlite_core_1.index)("idx_entries_game_word").on(table.gameId, table.word),
    // 重複チェック用複合インデックス
    gameReadingWordIdx: (0, sqlite_core_1.index)("idx_entries_game_reading_word").on(table.gameId, table.reading, table.word),
}));
//# sourceMappingURL=schema.js.map