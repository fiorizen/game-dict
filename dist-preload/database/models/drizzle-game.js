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
exports.DrizzleGameModel = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("../schema.js"));
class DrizzleGameModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        return this.db
            .select()
            .from(schema.games)
            .orderBy(schema.games.name)
            .all();
    }
    getById(id) {
        const results = this.db
            .select()
            .from(schema.games)
            .where((0, drizzle_orm_1.eq)(schema.games.id, id))
            .limit(1)
            .all();
        return results[0] || null;
    }
    create(data) {
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
    update(id, data) {
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
            .where((0, drizzle_orm_1.eq)(schema.games.id, id))
            .returning()
            .all();
        return result[0] || null;
    }
    delete(id) {
        const result = this.db
            .delete(schema.games)
            .where((0, drizzle_orm_1.eq)(schema.games.id, id))
            .run();
        return result.changes > 0;
    }
    findByName(name) {
        const results = this.db
            .select()
            .from(schema.games)
            .where((0, drizzle_orm_1.eq)(schema.games.name, name))
            .limit(1)
            .all();
        return results[0] || null;
    }
    getRecentGames(limit = 10) {
        return this.db
            .select()
            .from(schema.games)
            .orderBy((0, drizzle_orm_1.desc)(schema.games.updatedAt))
            .limit(limit)
            .all();
    }
    count() {
        const result = this.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema.games)
            .all();
        return result[0].count;
    }
}
exports.DrizzleGameModel = DrizzleGameModel;
//# sourceMappingURL=drizzle-game.js.map