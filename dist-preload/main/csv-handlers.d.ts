export declare class CSVHandlers {
    private db;
    constructor();
    /**
     * Export all game data to Git-managed CSV format (games.csv, categories.csv, game-{ID}.csv)
     */
    exportToGitCsv(outputDir?: string): Promise<string[]>;
    /**
     * Export entries for a specific game to IME dictionary CSV format
     */
    exportToImeCsv(gameId: number, format: "google" | "ms" | "atok", outputPath: string): Promise<void>;
    /**
     * Export current game entries to Microsoft IME format (.txt with tab-separated values)
     */
    exportToMicrosoftIme(gameId: number): Promise<string>;
    /**
     * Import all CSV data from Git-managed directory (games.csv, categories.csv, game-*.csv)
     */
    importFromGitCsvDirectory(inputDir: string): Promise<void>;
    /**
     * Import games data from games.csv
     */
    private importGamesFromCsv;
    /**
     * Import categories data from categories.csv
     */
    private importCategoriesFromCsv;
    /**
     * Import CSV data into the database (single file)
     */
    importFromCsv(filePath: string): Promise<void>;
    /**
     * Get suggested file paths for exports
     */
    getSuggestedPaths(gameId?: number): {
        gitCsv: string;
        googleCsv: string;
        msCsv: string;
        atokCsv: string;
    };
}
//# sourceMappingURL=csv-handlers.d.ts.map