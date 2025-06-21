export interface Game {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}
export interface NewGame {
    name: string;
}
export type CreateGameData = NewGame;
export type UpdateGameData = Partial<NewGame>;
export interface Category {
    id: number;
    name: string;
    google_ime_name: string | null;
    ms_ime_name: string | null;
    atok_name: string | null;
    created_at: string;
    updated_at: string;
}
export interface NewCategory {
    name: string;
    google_ime_name?: string;
    ms_ime_name?: string;
    atok_name?: string;
}
export type CreateCategoryData = NewCategory;
export type UpdateCategoryData = Partial<NewCategory>;
export interface Entry {
    id: number;
    game_id: number;
    category_id: number;
    reading: string;
    word: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}
export interface NewEntry {
    game_id: number;
    category_id: number;
    reading: string;
    word: string;
    description?: string;
}
export type CreateEntryData = NewEntry;
export type UpdateEntryData = Partial<Omit<NewEntry, "game_id">>;
export interface EntryWithDetails extends Entry {
    game_name: string;
    category_name: string;
}
//# sourceMappingURL=types.d.ts.map