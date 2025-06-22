import type { Game as DrizzleGame, Category as DrizzleCategory, Entry as DrizzleEntry, EntryWithDetails as DrizzleEntryWithDetails } from "./schema.js";
import type { Game, Category, Entry, EntryWithDetails } from "../shared/types.js";
export declare function drizzleGameToLegacy(drizzleGame: DrizzleGame): Game;
export declare function drizzleCategoryToLegacy(drizzleCategory: DrizzleCategory): Category;
export declare function drizzleEntryToLegacy(drizzleEntry: DrizzleEntry): Entry;
export declare function drizzleEntryWithDetailsToLegacy(drizzleEntry: DrizzleEntryWithDetails): EntryWithDetails;
export declare function legacyGameToDrizzle(legacyGame: Omit<Game, "id" | "created_at" | "updated_at">): {
    name: string;
    code: string;
};
export declare function legacyCategoryToDrizzle(legacyCategory: Omit<Category, "id" | "created_at" | "updated_at"> | {
    name: string;
    google_ime_name?: string;
    ms_ime_name?: string;
    atok_name?: string;
}): {
    name: string;
    googleImeName?: string;
    msImeName?: string;
    atokName?: string;
};
export declare function legacyEntryToDrizzle(legacyEntry: Omit<Entry, "id" | "created_at" | "updated_at"> | {
    game_id: number;
    category_id: number;
    reading: string;
    word: string;
    description?: string;
}): {
    gameId: number;
    categoryId: number;
    reading: string;
    word: string;
    description?: string;
};
//# sourceMappingURL=adapters.d.ts.map