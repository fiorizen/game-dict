"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entries = exports.categories = exports.games = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Games table
exports.games = (0, sqlite_core_1.sqliteTable)("games", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull().unique(),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
// Categories table
exports.categories = (0, sqlite_core_1.sqliteTable)("categories", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull().unique(),
    googleImeName: (0, sqlite_core_1.text)("google_ime_name"),
    msImeName: (0, sqlite_core_1.text)("ms_ime_name"),
    atokName: (0, sqlite_core_1.text)("atok_name"),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
// Entries table
exports.entries = (0, sqlite_core_1.sqliteTable)("entries", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    gameId: (0, sqlite_core_1.integer)("game_id").notNull().references(() => exports.games.id, { onDelete: "cascade" }),
    categoryId: (0, sqlite_core_1.integer)("category_id").notNull().references(() => exports.categories.id, { onDelete: "restrict" }),
    reading: (0, sqlite_core_1.text)("reading").notNull(),
    word: (0, sqlite_core_1.text)("word").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    createdAt: (0, sqlite_core_1.text)("created_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)("updated_at").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => ({
    gameIdIdx: (0, sqlite_core_1.index)("idx_entries_game_id").on(table.gameId),
    categoryIdIdx: (0, sqlite_core_1.index)("idx_entries_category_id").on(table.categoryId),
    readingIdx: (0, sqlite_core_1.index)("idx_entries_reading").on(table.reading),
}));
//# sourceMappingURL=schema.js.map