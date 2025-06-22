"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModel = void 0;
const validation_js_1 = require("../../shared/validation.js");
class GameModel {
    constructor(db) {
        this.db = db;
    }
    getAll() {
        const stmt = this.db.prepare("SELECT * FROM games ORDER BY name ASC");
        return stmt.all();
    }
    getById(id) {
        const stmt = this.db.prepare("SELECT * FROM games WHERE id = ?");
        return stmt.get(id) || null;
    }
    create(game) {
        // Validate code
        const validation = (0, validation_js_1.validateGameCode)(game.code);
        if (!validation.valid) {
            throw new Error(`Invalid game code: ${validation.error}`);
        }
        // Check if code already exists
        const existingGame = this.getByCode(game.code);
        if (existingGame) {
            throw new Error(`Game code '${game.code}' already exists`);
        }
        const stmt = this.db.prepare(`
			INSERT INTO games (name, code, created_at, updated_at)
			VALUES (?, ?, datetime('now'), datetime('now'))
		`);
        const result = stmt.run(game.name, game.code);
        const insertedId = result.lastInsertRowid;
        const created = this.getById(insertedId);
        if (!created) {
            throw new Error("Failed to create game");
        }
        return created;
    }
    update(id, updates) {
        if (Object.keys(updates).length === 0) {
            return this.getById(id);
        }
        // Validate code if being updated
        if (updates.code) {
            const validation = (0, validation_js_1.validateGameCode)(updates.code);
            if (!validation.valid) {
                throw new Error(`Invalid game code: ${validation.error}`);
            }
            // Check if code already exists (excluding current game)
            const existingGame = this.getByCode(updates.code);
            if (existingGame && existingGame.id !== id) {
                throw new Error(`Game code '${updates.code}' already exists`);
            }
        }
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");
        const stmt = this.db.prepare(`
			UPDATE games 
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
    delete(id) {
        const stmt = this.db.prepare("DELETE FROM games WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }
    deleteWithRelatedEntries(id) {
        // まず関連エントリー数を取得
        const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM entries WHERE game_id = ?");
        const entryCount = countStmt.get(id).count;
        // トランザクション内で関連エントリーとゲームを削除
        const transaction = this.db.transaction(() => {
            // 関連エントリーを削除
            const deleteEntriesStmt = this.db.prepare("DELETE FROM entries WHERE game_id = ?");
            const entriesResult = deleteEntriesStmt.run(id);
            // ゲームを削除
            const deleteGameStmt = this.db.prepare("DELETE FROM games WHERE id = ?");
            const gameResult = deleteGameStmt.run(id);
            return {
                deletedGame: gameResult.changes > 0,
                deletedEntries: entriesResult.changes
            };
        });
        return transaction();
    }
    getEntryCount(id) {
        const stmt = this.db.prepare("SELECT COUNT(*) as count FROM entries WHERE game_id = ?");
        const result = stmt.get(id);
        return result.count;
    }
    getByName(name) {
        const stmt = this.db.prepare("SELECT * FROM games WHERE name = ?");
        return stmt.get(name) || null;
    }
    getByCode(code) {
        const stmt = this.db.prepare("SELECT * FROM games WHERE code = ?");
        return stmt.get(code) || null;
    }
}
exports.GameModel = GameModel;
//# sourceMappingURL=game.js.map