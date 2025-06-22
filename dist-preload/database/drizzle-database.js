"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleDatabase = void 0;
const drizzle_connection_js_1 = require("./drizzle-connection.js");
const drizzle_game_js_1 = require("./models/drizzle-game.js");
const drizzle_category_js_1 = require("./models/drizzle-category.js");
const drizzle_entry_js_1 = require("./models/drizzle-entry.js");
class DrizzleDatabase {
    constructor() {
        this.connection = drizzle_connection_js_1.DrizzleConnection.getInstance();
        const db = this.connection.getDatabase();
        this.games = new drizzle_game_js_1.DrizzleGameModel(db);
        this.categories = new drizzle_category_js_1.DrizzleCategoryModel(db);
        this.entries = new drizzle_entry_js_1.DrizzleEntryModel(db);
    }
    static getInstance() {
        if (!DrizzleDatabase.instance) {
            DrizzleDatabase.instance = new DrizzleDatabase();
        }
        return DrizzleDatabase.instance;
    }
    static resetInstance() {
        if (DrizzleDatabase.instance) {
            drizzle_connection_js_1.DrizzleConnection.resetInstance();
        }
        DrizzleDatabase.instance = undefined;
    }
    getDbPath() {
        return this.connection.getDbPath();
    }
    close() {
        this.connection.close();
    }
    getConnection() {
        return this.connection;
    }
}
exports.DrizzleDatabase = DrizzleDatabase;
//# sourceMappingURL=drizzle-database.js.map