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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVHandlers = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const sync_1 = require("csv-parse/sync");
const sync_2 = require("csv-stringify/sync");
const index_js_1 = require("../database/index.js");
const logger_js_1 = require("../shared/logger.js");
const validation_js_1 = require("../shared/validation.js");
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
        // カテゴリルックアップ最適化: O(1)アクセスのためのMap作成
        const categoryMap = new Map(categories.map((c) => [c.id, c]));
        // Use test directory if in test environment, otherwise use csv
        const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
        const defaultDir = isTestEnvironment
            ? path.join(process.cwd(), "test-data", "csv")
            : path.join(process.cwd(), "csv");
        const exportDir = outputDir || defaultDir;
        // Ensure export directory exists
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        const exportedFiles = [];
        // 1. Export games.csv
        if (games.length > 0) {
            const gamesData = games.map((game) => ({
                id: game.id,
                name: game.name,
                code: game.code,
                created_at: game.created_at,
                updated_at: game.updated_at,
            }));
            const gamesCsvString = (0, sync_2.stringify)(gamesData, {
                header: true,
                columns: ["id", "name", "code", "created_at", "updated_at"],
            });
            const gamesFilePath = path.join(exportDir, "games.csv");
            await fs.promises.writeFile(gamesFilePath, gamesCsvString, "utf-8");
            exportedFiles.push(gamesFilePath);
            logger_js_1.log.debug("Exported games.csv", gamesFilePath);
        }
        // 2. Export categories.csv
        if (categories.length > 0) {
            const categoriesData = categories.map((category) => ({
                id: category.id,
                name: category.name,
                google_ime_name: category.google_ime_name || "",
                ms_ime_name: category.ms_ime_name || "",
                atok_name: category.atok_name || "",
            }));
            const categoriesCsvString = (0, sync_2.stringify)(categoriesData, {
                header: true,
                columns: ["id", "name", "google_ime_name", "ms_ime_name", "atok_name"],
            });
            const categoriesFilePath = path.join(exportDir, "categories.csv");
            await fs.promises.writeFile(categoriesFilePath, categoriesCsvString, "utf-8");
            exportedFiles.push(categoriesFilePath);
            logger_js_1.log.debug("Exported categories.csv", categoriesFilePath);
        }
        // 3. Export game-{code}.csv for each game with entries
        for (const game of games) {
            const entries = this.db.entries.getByGameId(game.id);
            // Skip empty games
            if (entries.length === 0) {
                continue;
            }
            // Export structure: category_name, reading, word, description
            const csvData = entries.map((entry) => {
                const category = categoryMap.get(entry.category_id);
                return {
                    category_name: category?.name ?? "",
                    reading: entry.reading,
                    word: entry.word,
                    description: entry.description ?? "",
                };
            });
            const csvString = (0, sync_2.stringify)(csvData, {
                header: true,
                columns: ["category_name", "reading", "word", "description"],
            });
            // Add game name as comment at the top
            const csvWithComment = `# Game: ${game.name} (Code: ${game.code})\n${csvString}`;
            // Fixed filename: game-{code}.csv
            const filePath = path.join(exportDir, `game-${game.code}.csv`);
            await fs.promises.writeFile(filePath, csvWithComment, "utf-8");
            exportedFiles.push(filePath);
            logger_js_1.log.debug("Exported game entries CSV", filePath);
        }
        return exportedFiles;
    }
    /**
     * Export entries for a specific game to IME dictionary CSV format
     */
    async exportToImeCsv(gameId, format, outputPath) {
        const entries = this.db.entries.getByGameId(gameId);
        const categories = this.db.categories.getAll();
        // カテゴリルックアップ最適化: O(1)アクセスのためのMap作成
        const categoryMap = new Map(categories.map((c) => [c.id, c]));
        const csvData = entries.map((entry) => {
            const category = categoryMap.get(entry.category_id);
            let categoryName = "";
            // Map category to IME-specific format
            if (category) {
                switch (format) {
                    case "google":
                        categoryName = category.google_ime_name ?? "名詞";
                        break;
                    case "ms":
                        categoryName = category.ms_ime_name ?? "名詞";
                        break;
                    case "atok":
                        categoryName = category.atok_name ?? "名詞";
                        break;
                }
            }
            else {
                categoryName = "名詞";
            }
            return {
                reading: entry.reading,
                word: entry.word,
                category: categoryName,
            };
        });
        const csvString = (0, sync_2.stringify)(csvData, {
            header: false, // IME dictionaries typically don't have headers
            columns: ["reading", "word", "category"],
        });
        await fs.promises.writeFile(outputPath, csvString, "utf-8");
        logger_js_1.log.debug("Exported IME CSV", outputPath);
    }
    /**
     * Export current game entries to Microsoft IME format (.txt with tab-separated values)
     */
    async exportToMicrosoftIme(gameId) {
        const game = this.db.games.getById(gameId);
        if (!game) {
            throw new Error(`Game with ID ${gameId} not found`);
        }
        const entries = this.db.entries.getByGameId(gameId);
        // Check if there are any entries to export
        if (entries.length === 0) {
            throw new Error(`No entries found for game '${game.name}'. IME export requires at least one entry.`);
        }
        const categories = this.db.categories.getAll();
        // カテゴリルックアップ最適化: O(1)アクセスのためのMap作成
        const categoryMap = new Map(categories.map((c) => [c.id, c]));
        // Create export directory if it doesn't exist
        const exportDir = path.join(process.cwd(), "export");
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        // Build tab-separated content: reading \t word \t category_name
        const lines = entries.map((entry) => {
            const category = categoryMap.get(entry.category_id);
            const categoryName = category?.ms_ime_name ?? "名詞";
            return `${entry.reading}\t${entry.word}\t${categoryName}`;
        });
        const content = `${lines.join("\n")}\n`;
        const filePath = path.join(exportDir, `${game.code}.txt`);
        await fs.promises.writeFile(filePath, content, "utf-8");
        logger_js_1.log.debug("Exported Microsoft IME file", filePath);
        return filePath;
    }
    /**
     * Import all CSV data from Git-managed directory (games.csv, categories.csv, game-*.csv)
     */
    async importFromGitCsvDirectory(inputDir) {
        if (!fs.existsSync(inputDir)) {
            throw new Error(`Directory not found: ${inputDir}`);
        }
        const files = fs.readdirSync(inputDir);
        // 1. Import games.csv first
        const gamesFile = files.find((f) => f === "games.csv");
        if (gamesFile) {
            await this.importGamesFromCsv(path.join(inputDir, gamesFile));
        }
        // 2. Import categories.csv
        const categoriesFile = files.find((f) => f === "categories.csv");
        if (categoriesFile) {
            await this.importCategoriesFromCsv(path.join(inputDir, categoriesFile));
        }
        // 3. Import game-*.csv files (both old format game-{id}.csv and new format game-{code}.csv)
        const gameFiles = files.filter((f) => f.startsWith("game-") && f.endsWith(".csv"));
        for (const gameFile of gameFiles) {
            await this.importFromCsv(path.join(inputDir, gameFile));
        }
    }
    /**
     * Import games data from games.csv
     */
    async importGamesFromCsv(filePath) {
        logger_js_1.log.debug("Importing games from CSV", filePath);
        const csvContent = await fs.promises.readFile(filePath, "utf-8");
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
        });
        for (const record of records) {
            const existingGame = this.db.games.getById(parseInt(record.id));
            if (!existingGame) {
                // Create new game with specific ID (Note: this may require custom SQL)
                const stmt = this.db.getDatabase().prepare(`
					INSERT INTO games (id, name, code, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?)
				`);
                stmt.run(parseInt(record.id), record.name, record.code, record.created_at || new Date().toISOString(), record.updated_at || new Date().toISOString());
            }
        }
    }
    /**
     * Import categories data from categories.csv
     */
    async importCategoriesFromCsv(filePath) {
        logger_js_1.log.debug("Importing categories from CSV", filePath);
        const csvContent = await fs.promises.readFile(filePath, "utf-8");
        const records = (0, sync_1.parse)(csvContent, {
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
        logger_js_1.log.debug("Importing from CSV", filePath);
        const csvContent = await fs.promises.readFile(filePath, "utf-8");
        // Extract game name from comment line if present
        let gameNameFromComment = "";
        const lines = csvContent.split("\n");
        if (lines[0].startsWith("#")) {
            // Try new format first: # Game: name (Code: code)
            const newFormatMatch = lines[0].match(/# Game: (.+) \(Code: .+\)/);
            if (newFormatMatch) {
                gameNameFromComment = newFormatMatch[1];
            }
            else {
                // Fallback to old format: # Game: name (ID: id)
                const oldFormatMatch = lines[0].match(/# Game: (.+) \(ID: \d+\)/);
                if (oldFormatMatch) {
                    gameNameFromComment = oldFormatMatch[1];
                }
            }
        }
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
            comment: "#", // Skip comment lines
        });
        const gameCache = new Map();
        const categoryCache = new Map();
        // Determine game name: use comment or derive from filename
        let gameName = gameNameFromComment;
        if (!gameName) {
            const filename = path.basename(filePath, ".csv");
            // If filename is game-{ID}.csv, we need to ask user or use filename as is
            gameName = filename.startsWith("game-") ? filename : filename;
        }
        // Ensure game exists
        let game = gameCache.get(gameName);
        if (!game) {
            const existingGames = this.db.games
                .getAll()
                .filter((g) => g.name === gameName);
            if (existingGames.length > 0) {
                game = existingGames[0];
                if (game) {
                    gameCache.set(gameName, game);
                }
            }
            else {
                // Generate a unique code from the game name
                let gameCode = (0, validation_js_1.generateGameCodeFromName)(gameName);
                if (!gameCode) {
                    gameCode = "imported";
                }
                // Ensure uniqueness
                const existingGames = this.db.games.getAll();
                const existingCodes = existingGames.map((g) => g.code);
                let counter = 1;
                let finalCode = gameCode;
                while (existingCodes.includes(finalCode)) {
                    const suffix = counter.toString();
                    const maxBaseLength = 16 - suffix.length;
                    finalCode = gameCode.substring(0, maxBaseLength) + suffix;
                    counter++;
                }
                game = this.db.games.create({ name: gameName, code: finalCode });
                if (game) {
                    gameCache.set(gameName, game);
                }
            }
        }
        // Ensure game is defined before proceeding
        if (!game) {
            throw new Error(`Failed to create or find game: ${gameName}`);
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
                    if (category) {
                        categoryCache.set(record.category_name, category);
                    }
                }
                else {
                    // Create category with default IME mappings
                    category = this.db.categories.create({
                        name: record.category_name,
                        google_ime_name: "名詞",
                        ms_ime_name: "名詞",
                        atok_name: "名詞",
                    });
                    if (category) {
                        categoryCache.set(record.category_name, category);
                    }
                }
            }
            // Ensure category is defined before proceeding
            if (!category) {
                throw new Error(`Failed to create or find category: ${record.category_name}`);
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
     * Import entries from Microsoft IME text file
     */
    async importFromImeTxt(gameId, filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const game = this.db.games.getById(gameId);
        if (!game) {
            throw new Error(`Game with ID ${gameId} not found`);
        }
        // Read and validate entire file first
        logger_js_1.log.debug("Importing from IME text file", filePath);
        const content = await fs.promises.readFile(filePath, "utf-8");
        const lines = content.split("\n").filter((line) => line.trim());
        const errors = [];
        const validEntries = [];
        // Validate all lines first
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const parts = line.split("\t");
            if (parts.length !== 3) {
                errors.push(`Line ${i + 1}: Expected 3 tab-separated fields, got ${parts.length}`);
                continue;
            }
            const [reading, word, categoryName] = parts;
            if (!reading.trim()) {
                errors.push(`Line ${i + 1}: Reading field is empty`);
            }
            if (!word.trim()) {
                errors.push(`Line ${i + 1}: Word field is empty`);
            }
            if (!categoryName.trim()) {
                errors.push(`Line ${i + 1}: Category field is empty`);
            }
            if (reading.trim() && word.trim() && categoryName.trim()) {
                validEntries.push({
                    reading: reading.trim(),
                    word: word.trim(),
                    categoryName: categoryName.trim(),
                });
            }
        }
        // If any validation errors, return without importing
        if (errors.length > 0) {
            return {
                imported: 0,
                skipped: 0,
                errors,
            };
        }
        // All validations passed, proceed with import
        const categoryCache = new Map();
        let importedCount = 0;
        let skippedCount = 0;
        for (const entry of validEntries) {
            // Get or create category
            let category = categoryCache.get(entry.categoryName);
            if (!category) {
                const existingCategories = this.db.categories
                    .getAll()
                    .filter((c) => c.name === entry.categoryName);
                if (existingCategories.length > 0) {
                    category = existingCategories[0];
                    if (category) {
                        categoryCache.set(entry.categoryName, category);
                    }
                }
                else {
                    // Create new category with "名詞" as default
                    category = this.db.categories.create({
                        name: entry.categoryName,
                        google_ime_name: "名詞",
                        ms_ime_name: "名詞",
                        atok_name: "名詞",
                    });
                    if (category) {
                        categoryCache.set(entry.categoryName, category);
                    }
                }
            }
            // Ensure category is defined before proceeding
            if (!category) {
                throw new Error(`Failed to create or find category: ${entry.categoryName}`);
            }
            // Check if entry already exists
            const existingEntries = this.db.entries
                .getByGameId(gameId)
                .filter((e) => e.reading === entry.reading &&
                e.word === entry.word &&
                e.category_id === category.id);
            if (existingEntries.length === 0) {
                // Create new entry
                this.db.entries.create({
                    game_id: gameId,
                    category_id: category.id,
                    reading: entry.reading,
                    word: entry.word,
                    description: undefined,
                });
                importedCount++;
            }
            else {
                skippedCount++;
            }
        }
        return {
            imported: importedCount,
            skipped: skippedCount,
            errors: [],
        };
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
            gitCsv: path.join(process.cwd(), `${gameName}-${timestamp}.csv`),
            googleCsv: path.join(process.cwd(), `${gameName}-google-${timestamp}.csv`),
            msCsv: path.join(process.cwd(), `${gameName}-ms-${timestamp}.csv`),
            atokCsv: path.join(process.cwd(), `${gameName}-atok-${timestamp}.csv`),
        };
    }
}
exports.CSVHandlers = CSVHandlers;
//# sourceMappingURL=csv-handlers.js.map