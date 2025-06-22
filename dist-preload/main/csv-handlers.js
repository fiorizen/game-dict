"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVHandlers = void 0;
// @ts-nocheck
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const sync_1 = require("csv-stringify/sync");
const sync_2 = require("csv-parse/sync");
const index_js_1 = require("../database/index.js");
class CSVHandlers {
    constructor() {
        this.db = index_js_1.Database.getInstance();
    }
    /**
     * Export all game data to Git-managed CSV format (games.csv, categories.csv, game-{ID}.csv)
     */
    async exportToGitCsv(outputDir) {
        const games = this.db.games.getAll();
        const categories = this.db.categories.getAll();
        // Use test directory if in test environment (check database path), otherwise use csv-exports
        const dbPath = this.db.getDbPath();
        const isTestEnvironment = dbPath.includes('test-data') || dbPath.includes('test') ||
            process.env.NODE_ENV === 'test';
        const defaultDir = isTestEnvironment
            ? node_path_1.default.join(process.cwd(), 'test-data', 'csv')
            : node_path_1.default.join(process.cwd(), 'csv');
        const exportDir = outputDir || defaultDir;
        // Ensure export directory exists
        if (!node_fs_1.default.existsSync(exportDir)) {
            node_fs_1.default.mkdirSync(exportDir, { recursive: true });
        }
        const exportedFiles = [];
        // 1. Export games.csv
        if (games.length > 0) {
            const gamesData = games.map((game) => ({
                id: game.id,
                name: game.name,
                created_at: game.created_at,
                updated_at: game.updated_at,
            }));
            const gamesCsvString = (0, sync_1.stringify)(gamesData, {
                header: true,
                columns: ["id", "name", "created_at", "updated_at"],
            });
            const gamesFilePath = node_path_1.default.join(exportDir, "games.csv");
            node_fs_1.default.writeFileSync(gamesFilePath, gamesCsvString, "utf-8");
            exportedFiles.push(gamesFilePath);
        }
        // 2. Export categories.csv
        if (categories.length > 0) {
            const categoriesData = categories.map((category) => ({
                id: category.id,
                name: category.name,
                google_ime_name: category.google_ime_name,
                ms_ime_name: category.ms_ime_name,
                atok_name: category.atok_name,
            }));
            const categoriesCsvString = (0, sync_1.stringify)(categoriesData, {
                header: true,
                columns: ["id", "name", "google_ime_name", "ms_ime_name", "atok_name"],
            });
            const categoriesFilePath = node_path_1.default.join(exportDir, "categories.csv");
            node_fs_1.default.writeFileSync(categoriesFilePath, categoriesCsvString, "utf-8");
            exportedFiles.push(categoriesFilePath);
        }
        // 3. Export game-{ID}.csv for each game with entries
        for (const game of games) {
            const entries = this.db.entries.getByGameId(game.id);
            // Skip empty games
            if (entries.length === 0) {
                continue;
            }
            // Export structure: category_name, reading, word, description
            const csvData = entries.map((entry) => {
                const category = categories.find((c) => c.id === entry.category_id);
                return {
                    category_name: category?.name || "",
                    reading: entry.reading,
                    word: entry.word,
                    description: entry.description || "",
                };
            });
            const csvString = (0, sync_1.stringify)(csvData, {
                header: true,
                columns: ["category_name", "reading", "word", "description"],
            });
            // Add game name as comment at the top
            const csvWithComment = `# Game: ${game.name} (ID: ${game.id})\n${csvString}`;
            // Fixed filename: game-{ID}.csv
            const filePath = node_path_1.default.join(exportDir, `game-${game.id}.csv`);
            node_fs_1.default.writeFileSync(filePath, csvWithComment, "utf-8");
            exportedFiles.push(filePath);
        }
        return exportedFiles;
    }
    /**
     * Export entries for a specific game to IME dictionary CSV format
     */
    async exportToImeCsv(gameId, format, outputPath) {
        const entries = this.db.entries.getByGameId(gameId);
        const categories = this.db.categories.getAll();
        const csvData = entries.map((entry) => {
            const category = categories.find((c) => c.id === entry.category_id);
            let categoryName = "";
            // Map category to IME-specific format
            switch (format) {
                case "google":
                    categoryName = category?.google_ime_name || "一般";
                    break;
                case "ms":
                    categoryName = category?.ms_ime_name || "一般";
                    break;
                case "atok":
                    categoryName = category?.atok_name || "一般";
                    break;
            }
            return {
                reading: entry.reading,
                word: entry.word,
                category: categoryName,
            };
        });
        const csvString = (0, sync_1.stringify)(csvData, {
            header: false, // IME dictionaries typically don't have headers
            columns: ["reading", "word", "category"],
        });
        node_fs_1.default.writeFileSync(outputPath, csvString, "utf-8");
    }
    /**
     * Import all CSV data from Git-managed directory (games.csv, categories.csv, game-*.csv)
     */
    async importFromGitCsvDirectory(inputDir) {
        if (!node_fs_1.default.existsSync(inputDir)) {
            throw new Error(`Directory not found: ${inputDir}`);
        }
        const files = node_fs_1.default.readdirSync(inputDir);
        // 1. Import games.csv first
        const gamesFile = files.find(f => f === 'games.csv');
        if (gamesFile) {
            await this.importGamesFromCsv(node_path_1.default.join(inputDir, gamesFile));
        }
        // 2. Import categories.csv
        const categoriesFile = files.find(f => f === 'categories.csv');
        if (categoriesFile) {
            await this.importCategoriesFromCsv(node_path_1.default.join(inputDir, categoriesFile));
        }
        // 3. Import game-*.csv files
        const gameFiles = files.filter(f => f.startsWith('game-') && f.endsWith('.csv'));
        for (const gameFile of gameFiles) {
            await this.importFromCsv(node_path_1.default.join(inputDir, gameFile));
        }
    }
    /**
     * Import games data from games.csv
     */
    async importGamesFromCsv(filePath) {
        const csvContent = node_fs_1.default.readFileSync(filePath, "utf-8");
        const records = (0, sync_2.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
        });
        for (const record of records) {
            const existingGame = this.db.games.getById(parseInt(record.id));
            if (!existingGame) {
                // Create new game with specific ID (Note: this may require custom SQL)
                const stmt = this.db.getDatabase().prepare(`
					INSERT INTO games (id, name, created_at, updated_at)
					VALUES (?, ?, ?, ?)
				`);
                stmt.run(parseInt(record.id), record.name, record.created_at || new Date().toISOString(), record.updated_at || new Date().toISOString());
            }
        }
    }
    /**
     * Import categories data from categories.csv
     */
    async importCategoriesFromCsv(filePath) {
        const csvContent = node_fs_1.default.readFileSync(filePath, "utf-8");
        const records = (0, sync_2.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
        });
        for (const record of records) {
            const existingCategory = this.db.categories.getById(parseInt(record.id));
            if (!existingCategory) {
                // Create new category with specific ID
                const stmt = this.db.getDatabase().prepare(`
					INSERT INTO categories (id, name, google_ime_name, ms_ime_name, atok_name)
					VALUES (?, ?, ?, ?, ?)
				`);
                stmt.run(parseInt(record.id), record.name, record.google_ime_name, record.ms_ime_name, record.atok_name);
            }
        }
    }
    /**
     * Import CSV data into the database (single file)
     */
    async importFromCsv(filePath) {
        const csvContent = node_fs_1.default.readFileSync(filePath, "utf-8");
        // Extract game name from comment line if present
        let gameNameFromComment = "";
        const lines = csvContent.split('\n');
        if (lines[0].startsWith('#')) {
            const commentMatch = lines[0].match(/# Game: (.+) \(ID: \d+\)/);
            if (commentMatch) {
                gameNameFromComment = commentMatch[1];
            }
        }
        const records = (0, sync_2.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
            comment: '#', // Skip comment lines
        });
        const gameCache = new Map();
        const categoryCache = new Map();
        // Determine game name: use comment or derive from filename
        let gameName = gameNameFromComment;
        if (!gameName) {
            const filename = node_path_1.default.basename(filePath, '.csv');
            // If filename is game-{ID}.csv, we need to ask user or use filename as is
            gameName = filename.startsWith('game-') ? filename : filename;
        }
        // Ensure game exists
        let game = gameCache.get(gameName);
        if (!game) {
            const existingGames = this.db.games
                .getAll()
                .filter((g) => g.name === gameName);
            if (existingGames.length > 0) {
                game = existingGames[0];
            }
            else {
                game = this.db.games.create({ name: gameName });
            }
            gameCache.set(gameName, game);
        }
        for (const record of records) {
            // Ensure category exists
            let category = categoryCache.get(record.category_name);
            if (!category) {
                const existingCategories = this.db.categories
                    .getAll()
                    .filter((c) => c.name === record.category_name);
                if (existingCategories.length > 0) {
                    category = existingCategories[0];
                }
                else {
                    // Create category with default IME mappings
                    category = this.db.categories.create({
                        name: record.category_name,
                        google_ime_name: "一般",
                        ms_ime_name: "一般",
                        atok_name: "一般",
                    });
                }
                categoryCache.set(record.category_name, category);
            }
            // Check if entry already exists
            const existingEntries = this.db.entries
                .getByGameId(game.id)
                .filter((e) => e.reading === record.reading &&
                e.word === record.word &&
                e.category_id === category.id);
            if (existingEntries.length === 0) {
                // Create new entry
                this.db.entries.create({
                    game_id: game.id,
                    category_id: category.id,
                    reading: record.reading,
                    word: record.word,
                    description: record.description || undefined,
                });
            }
        }
    }
    /**
     * Get suggested file paths for exports
     */
    getSuggestedPaths(gameId) {
        const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        let gameName = "all-games";
        if (gameId) {
            const game = this.db.games.getById(gameId);
            if (game) {
                gameName = game.name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
            }
        }
        return {
            gitCsv: node_path_1.default.join(process.cwd(), `${gameName}-${timestamp}.csv`),
            googleCsv: node_path_1.default.join(process.cwd(), `${gameName}-google-${timestamp}.csv`),
            msCsv: node_path_1.default.join(process.cwd(), `${gameName}-ms-${timestamp}.csv`),
            atokCsv: node_path_1.default.join(process.cwd(), `${gameName}-atok-${timestamp}.csv`),
        };
    }
}
exports.CSVHandlers = CSVHandlers;
//# sourceMappingURL=csv-handlers.js.map