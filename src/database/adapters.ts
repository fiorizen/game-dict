// Type adapters for converting between Drizzle schema and legacy types
import type { Game as DrizzleGame, Category as DrizzleCategory, Entry as DrizzleEntry, EntryWithDetails as DrizzleEntryWithDetails } from "./schema.js";
import type { Game, Category, Entry, EntryWithDetails } from "../shared/types.js";

// Convert Drizzle schema types to legacy types (snake_case)
export function drizzleGameToLegacy(drizzleGame: DrizzleGame): Game {
	return {
		id: drizzleGame.id,
		name: drizzleGame.name,
		created_at: drizzleGame.createdAt,
		updated_at: drizzleGame.updatedAt,
	};
}

export function drizzleCategoryToLegacy(drizzleCategory: DrizzleCategory): Category {
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

export function drizzleEntryToLegacy(drizzleEntry: DrizzleEntry): Entry {
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

export function drizzleEntryWithDetailsToLegacy(drizzleEntry: DrizzleEntryWithDetails): EntryWithDetails {
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
export function legacyGameToDrizzle(legacyGame: Omit<Game, "id" | "created_at" | "updated_at">): { name: string } {
	return {
		name: legacyGame.name,
	};
}

export function legacyCategoryToDrizzle(legacyCategory: Omit<Category, "id" | "created_at" | "updated_at"> | { name: string; google_ime_name?: string; ms_ime_name?: string; atok_name?: string; }): {
	name: string;
	googleImeName?: string;
	msImeName?: string;
	atokName?: string;
} {
	return {
		name: legacyCategory.name,
		googleImeName: legacyCategory.google_ime_name || undefined,
		msImeName: legacyCategory.ms_ime_name || undefined,
		atokName: legacyCategory.atok_name || undefined,
	};
}

export function legacyEntryToDrizzle(legacyEntry: Omit<Entry, "id" | "created_at" | "updated_at"> | { game_id: number; category_id: number; reading: string; word: string; description?: string; }): {
	gameId: number;
	categoryId: number;
	reading: string;
	word: string;
	description?: string;
} {
	return {
		gameId: legacyEntry.game_id,
		categoryId: legacyEntry.category_id,
		reading: legacyEntry.reading,
		word: legacyEntry.word,
		description: legacyEntry.description || undefined,
	};
}