import type { CreateCategoryData, CreateEntryData, CreateGameData, UpdateCategoryData, UpdateEntryData, UpdateGameData } from "../shared/types.js";
declare const api: {
    games: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (data: CreateGameData) => Promise<any>;
        update: (id: number, data: UpdateGameData) => Promise<any>;
        delete: (id: number) => Promise<any>;
    };
    categories: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (data: CreateCategoryData) => Promise<any>;
        update: (id: number, data: UpdateCategoryData) => Promise<any>;
        delete: (id: number) => Promise<any>;
    };
    entries: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        getByGameId: (gameId: number) => Promise<any>;
        create: (data: CreateEntryData) => Promise<any>;
        update: (id: number, data: UpdateEntryData) => Promise<any>;
        delete: (id: number) => Promise<any>;
        search: (query: string) => Promise<any>;
    };
    csv: {
        exportToGitCsv: (outputPath?: string) => Promise<any>;
        exportToImeCsv: (gameId: number, format: "google" | "ms" | "atok", outputPath?: string) => Promise<any>;
        importFromCsv: (filePath: string) => Promise<any>;
        getSuggestedPaths: (gameId?: number) => Promise<any>;
    };
    files: {
        showOpenDialog: (options: any) => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
    };
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=preload.d.ts.map