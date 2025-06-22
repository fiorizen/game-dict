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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleDatabase = exports.Database = void 0;
// Legacy implementation using DrizzleDatabaseWrapper for backward compatibility
const drizzle_wrapper_js_1 = require("./drizzle-wrapper.js");
// New Drizzle implementation
const drizzle_database_js_1 = require("./drizzle-database.js");
Object.defineProperty(exports, "DrizzleDatabase", { enumerable: true, get: function () { return drizzle_database_js_1.DrizzleDatabase; } });
class Database {
    constructor() {
        this.wrapper = drizzle_wrapper_js_1.DrizzleDatabaseWrapper.getInstance();
        this.games = this.wrapper.games;
        this.categories = this.wrapper.categories;
        this.entries = this.wrapper.entries;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    static resetInstance() {
        if (Database.instance) {
            try {
                Database.instance.close();
            }
            catch {
                // Ignore errors during close
            }
        }
        Database.instance = undefined;
        // Also reset the wrapper
        drizzle_wrapper_js_1.DrizzleDatabaseWrapper.resetInstance();
    }
    getDbPath() {
        return this.wrapper.getDbPath();
    }
    getDatabase() {
        return this.wrapper.getDatabase();
    }
    close() {
        this.wrapper.close();
    }
}
exports.Database = Database;
__exportStar(require("../shared/types.js"), exports);
__exportStar(require("./models/category.js"), exports);
__exportStar(require("./models/entry.js"), exports);
__exportStar(require("./models/game.js"), exports);
//# sourceMappingURL=index.js.map