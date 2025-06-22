"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleGameToLegacy = drizzleGameToLegacy;
exports.drizzleCategoryToLegacy = drizzleCategoryToLegacy;
exports.drizzleEntryToLegacy = drizzleEntryToLegacy;
exports.drizzleEntryWithDetailsToLegacy = drizzleEntryWithDetailsToLegacy;
exports.legacyGameToDrizzle = legacyGameToDrizzle;
exports.legacyCategoryToDrizzle = legacyCategoryToDrizzle;
exports.legacyEntryToDrizzle = legacyEntryToDrizzle;
// Convert Drizzle schema types to legacy types (snake_case)
function drizzleGameToLegacy(drizzleGame) {
    return {
        id: drizzleGame.id,
        name: drizzleGame.name,
        code: drizzleGame.code,
        created_at: drizzleGame.createdAt,
        updated_at: drizzleGame.updatedAt,
    };
}
function drizzleCategoryToLegacy(drizzleCategory) {
    return {
        id: drizzleCategory.id,
        name: drizzleCategory.name,
        google_ime_name: drizzleCategory.googleImeName || null,
        ms_ime_name: drizzleCategory.msImeName || null,
        atok_name: drizzleCategory.atokName || null,
        created_at: drizzleCategory.createdAt,
        updated_at: drizzleCategory.updatedAt,
    };
}
function drizzleEntryToLegacy(drizzleEntry) {
    return {
        id: drizzleEntry.id,
        game_id: drizzleEntry.gameId,
        category_id: drizzleEntry.categoryId,
        reading: drizzleEntry.reading,
        word: drizzleEntry.word,
        description: drizzleEntry.description || null,
        created_at: drizzleEntry.createdAt,
        updated_at: drizzleEntry.updatedAt,
    };
}
function drizzleEntryWithDetailsToLegacy(drizzleEntry) {
    return {
        id: drizzleEntry.id,
        game_id: drizzleEntry.gameId,
        category_id: drizzleEntry.categoryId,
        reading: drizzleEntry.reading,
        word: drizzleEntry.word,
        description: drizzleEntry.description || null,
        created_at: drizzleEntry.createdAt,
        updated_at: drizzleEntry.updatedAt,
        game_name: drizzleEntry.gameName,
        category_name: drizzleEntry.categoryName,
    };
}
// Convert legacy types to Drizzle schema input types (camelCase)
function legacyGameToDrizzle(legacyGame) {
    return {
        name: legacyGame.name,
        code: legacyGame.code,
    };
}
function legacyCategoryToDrizzle(legacyCategory) {
    return {
        name: legacyCategory.name,
        googleImeName: legacyCategory.google_ime_name || undefined,
        msImeName: legacyCategory.ms_ime_name || undefined,
        atokName: legacyCategory.atok_name || undefined,
    };
}
function legacyEntryToDrizzle(legacyEntry) {
    return {
        gameId: legacyEntry.game_id,
        categoryId: legacyEntry.category_id,
        reading: legacyEntry.reading,
        word: legacyEntry.word,
        description: legacyEntry.description || undefined,
    };
}
//# sourceMappingURL=adapters.js.map