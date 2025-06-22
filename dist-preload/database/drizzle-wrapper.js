"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleDatabaseWrapper = void 0;
// Wrapper classes to provide legacy API compatibility with Drizzle ORM
const drizzle_database_js_1 = require("./drizzle-database.js");
const adapters_js_1 = require("./adapters.js");
class DrizzleGameWrapper {
    constructor(drizzleDb) {
        this.drizzleDb = drizzleDb;
    }
    getAll() {
        return this.drizzleDb.games.getAll()
            .map(adapters_js_1.drizzleGameToLegacy);
    }
    getById(id) {
        const result = this.drizzleDb.games.getById(id);
        return result ? (0, adapters_js_1.drizzleGameToLegacy)(result) : null;
    }
    create(data) {
        const drizzleData = (0, adapters_js_1.legacyGameToDrizzle)(data);
        const result = this.drizzleDb.games.create(drizzleData);
        return (0, adapters_js_1.drizzleGameToLegacy)(result);
    }
    update(id, data) {
        const drizzleData = data.name ? { name: data.name } : {};
        const result = this.drizzleDb.games.update(id, drizzleData);
        return result ? (0, adapters_js_1.drizzleGameToLegacy)(result) : null;
    }
    delete(id) {
        return this.drizzleDb.games.delete(id);
    }
}
class DrizzleCategoryWrapper {
    constructor(drizzleDb) {
        this.drizzleDb = drizzleDb;
    }
    getAll() {
        return this.drizzleDb.categories.getAll()
            .map(adapters_js_1.drizzleCategoryToLegacy);
    }
    getById(id) {
        const result = this.drizzleDb.categories.getById(id);
        return result ? (0, adapters_js_1.drizzleCategoryToLegacy)(result) : null;
    }
    create(data) {
        const drizzleData = (0, adapters_js_1.legacyCategoryToDrizzle)(data);
        const result = this.drizzleDb.categories.create(drizzleData);
        return (0, adapters_js_1.drizzleCategoryToLegacy)(result);
    }
    update(id, data) {
        const drizzleData = {};
        if (data.name)
            drizzleData.name = data.name;
        if (data.google_ime_name !== undefined)
            drizzleData.googleImeName = data.google_ime_name;
        if (data.ms_ime_name !== undefined)
            drizzleData.msImeName = data.ms_ime_name;
        if (data.atok_name !== undefined)
            drizzleData.atokName = data.atok_name;
        const result = this.drizzleDb.categories.update(id, drizzleData);
        return result ? (0, adapters_js_1.drizzleCategoryToLegacy)(result) : null;
    }
    delete(id) {
        return this.drizzleDb.categories.delete(id);
    }
}
class DrizzleEntryWrapper {
    constructor(drizzleDb) {
        this.drizzleDb = drizzleDb;
    }
    getAll() {
        return this.drizzleDb.entries.getAll()
            .map(adapters_js_1.drizzleEntryToLegacy);
    }
    getAllWithDetails() {
        return this.drizzleDb.entries.getAllWithDetails()
            .map(adapters_js_1.drizzleEntryWithDetailsToLegacy);
    }
    getByGameId(gameId) {
        return this.drizzleDb.entries.getByGameId(gameId)
            .map(adapters_js_1.drizzleEntryToLegacy);
    }
    getByGameIdUnsorted(gameId) {
        return this.drizzleDb.entries.getByGameIdUnsorted(gameId)
            .map(adapters_js_1.drizzleEntryToLegacy);
    }
    getByGameIdWithDetails(gameId) {
        return this.drizzleDb.entries.getByGameIdWithDetails(gameId)
            .map(adapters_js_1.drizzleEntryWithDetailsToLegacy);
    }
    getById(id) {
        const result = this.drizzleDb.entries.getById(id);
        return result ? (0, adapters_js_1.drizzleEntryToLegacy)(result) : null;
    }
    getByIdWithDetails(id) {
        const result = this.drizzleDb.entries.getByIdWithDetails(id);
        return result ? (0, adapters_js_1.drizzleEntryWithDetailsToLegacy)(result) : null;
    }
    create(data) {
        const drizzleData = (0, adapters_js_1.legacyEntryToDrizzle)(data);
        const result = this.drizzleDb.entries.create(drizzleData);
        return (0, adapters_js_1.drizzleEntryToLegacy)(result);
    }
    update(id, data) {
        const drizzleData = {};
        if (data.game_id !== undefined)
            drizzleData.gameId = data.game_id;
        if (data.category_id !== undefined)
            drizzleData.categoryId = data.category_id;
        if (data.reading !== undefined)
            drizzleData.reading = data.reading;
        if (data.word !== undefined)
            drizzleData.word = data.word;
        if (data.description !== undefined)
            drizzleData.description = data.description;
        const result = this.drizzleDb.entries.update(id, drizzleData);
        return result ? (0, adapters_js_1.drizzleEntryToLegacy)(result) : null;
    }
    delete(id) {
        return this.drizzleDb.entries.delete(id);
    }
    search(query, gameId) {
        return this.drizzleDb.entries.search(query, gameId)
            .map(adapters_js_1.drizzleEntryWithDetailsToLegacy);
    }
    deleteByGameId(gameId) {
        return this.drizzleDb.entries.deleteByGameId(gameId);
    }
}
class DrizzleDatabaseWrapper {
    constructor() {
        this.drizzleDb = drizzle_database_js_1.DrizzleDatabase.getInstance();
        this.games = new DrizzleGameWrapper(this.drizzleDb);
        this.categories = new DrizzleCategoryWrapper(this.drizzleDb);
        this.entries = new DrizzleEntryWrapper(this.drizzleDb);
    }
    static getInstance() {
        if (!DrizzleDatabaseWrapper.instance) {
            DrizzleDatabaseWrapper.instance = new DrizzleDatabaseWrapper();
        }
        return DrizzleDatabaseWrapper.instance;
    }
    static resetInstance() {
        if (DrizzleDatabaseWrapper.instance) {
            drizzle_database_js_1.DrizzleDatabase.resetInstance();
        }
        DrizzleDatabaseWrapper.instance = undefined;
    }
    getDbPath() {
        return this.drizzleDb.getDbPath();
    }
    close() {
        this.drizzleDb.close();
    }
    getDatabase() {
        return this.drizzleDb.getConnection().getSqlite();
    }
}
exports.DrizzleDatabaseWrapper = DrizzleDatabaseWrapper;
//# sourceMappingURL=drizzle-wrapper.js.map