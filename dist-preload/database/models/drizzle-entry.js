"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleEntryModel = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("../schema.js"));
class DrizzleEntryModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        return this.db
            .select()
            .from(schema.entries)
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.reading))
            .all();
    }
    getAllWithDetails() {
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
            .innerJoin(schema.games, (0, drizzle_orm_1.eq)(schema.entries.gameId, schema.games.id))
            .innerJoin(schema.categories, (0, drizzle_orm_1.eq)(schema.entries.categoryId, schema.categories.id))
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.reading))
            .all();
        return results;
    }
    getByGameId(gameId) {
        return this.db
            .select()
            .from(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.reading))
            .all();
    }
    getByGameIdUnsorted(gameId) {
        return this.db
            .select()
            .from(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.id))
            .all();
    }
    getByGameIdWithDetails(gameId) {
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
            .innerJoin(schema.games, (0, drizzle_orm_1.eq)(schema.entries.gameId, schema.games.id))
            .innerJoin(schema.categories, (0, drizzle_orm_1.eq)(schema.entries.categoryId, schema.categories.id))
            .where((0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.reading))
            .all();
        return results;
    }
    getById(id) {
        const results = this.db
            .select()
            .from(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.id, id))
            .limit(1)
            .all();
        return results[0] || null;
    }
    getByIdWithDetails(id) {
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
            .innerJoin(schema.games, (0, drizzle_orm_1.eq)(schema.entries.gameId, schema.games.id))
            .innerJoin(schema.categories, (0, drizzle_orm_1.eq)(schema.entries.categoryId, schema.categories.id))
            .where((0, drizzle_orm_1.eq)(schema.entries.id, id))
            .limit(1)
            .all();
        return results[0] || null;
    }
    create(data) {
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
    update(id, data) {
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
            .where((0, drizzle_orm_1.eq)(schema.entries.id, id))
            .returning()
            .all();
        return result[0] || null;
    }
    delete(id) {
        const result = this.db
            .delete(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.id, id))
            .run();
        return result.changes > 0;
    }
    search(query, gameId) {
        const searchCondition = (0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema.entries.reading, `%${query}%`), (0, drizzle_orm_1.like)(schema.entries.word, `%${query}%`), (0, drizzle_orm_1.like)(schema.entries.description, `%${query}%`));
        const whereCondition = gameId
            ? (0, drizzle_orm_1.and)(searchCondition, (0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
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
            .innerJoin(schema.games, (0, drizzle_orm_1.eq)(schema.entries.gameId, schema.games.id))
            .innerJoin(schema.categories, (0, drizzle_orm_1.eq)(schema.entries.categoryId, schema.categories.id))
            .where(whereCondition)
            .orderBy((0, drizzle_orm_1.asc)(schema.entries.reading))
            .all();
        return results;
    }
    deleteByGameId(gameId) {
        const result = this.db
            .delete(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
            .run();
        return result.changes;
    }
    count() {
        const result = this.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema.entries)
            .all();
        return result[0].count;
    }
    countByGameId(gameId) {
        const result = this.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema.entries)
            .where((0, drizzle_orm_1.eq)(schema.entries.gameId, gameId))
            .all();
        return result[0].count;
    }
}
exports.DrizzleEntryModel = DrizzleEntryModel;
//# sourceMappingURL=drizzle-entry.js.map