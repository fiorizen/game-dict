import fs from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import { parse } from "csv-parse/sync";
import { Database } from "../database/index.js";
import type { Game, Category, Entry } from "../shared/types.js";

export class CSVHandlers {
	private db: Database;

	constructor() {
		this.db = Database.getInstance();
	}

	/**
	 * Export all game data to Git-managed CSV format
	 */
	async exportToGitCsv(outputPath: string): Promise<void> {
		const games = this.db.games.getAll();
		const categories = this.db.categories.getAll();
		const entries = this.db.entries.getAll();

		// Export structure: game_name, category_name, reading, word, description
		const csvData = entries.map((entry) => {
			const game = games.find((g) => g.id === entry.game_id);
			const category = categories.find((c) => c.id === entry.category_id);

			return {
				game_name: game?.name || "",
				category_name: category?.name || "",
				reading: entry.reading,
				word: entry.word,
				description: entry.description || "",
			};
		});

		const csvString = stringify(csvData, {
			header: true,
			columns: ["game_name", "category_name", "reading", "word", "description"],
		});

		fs.writeFileSync(outputPath, csvString, "utf-8");
	}

	/**
	 * Export entries for a specific game to IME dictionary CSV format
	 */
	async exportToImeCsv(
		gameId: number,
		format: "google" | "ms" | "atok",
		outputPath: string,
	): Promise<void> {
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

		const csvString = stringify(csvData, {
			header: false, // IME dictionaries typically don't have headers
			columns: ["reading", "word", "category"],
		});

		fs.writeFileSync(outputPath, csvString, "utf-8");
	}

	/**
	 * Import CSV data into the database
	 */
	async importFromCsv(filePath: string): Promise<void> {
		const csvContent = fs.readFileSync(filePath, "utf-8");
		const records = parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
		}) as Array<{
			game_name: string;
			category_name: string;
			reading: string;
			word: string;
			description?: string;
		}>;

		const gameCache = new Map<string, Game>();
		const categoryCache = new Map<string, Category>();

		for (const record of records) {
			// Ensure game exists
			let game = gameCache.get(record.game_name);
			if (!game) {
				const existingGames = this.db.games
					.getAll()
					.filter((g) => g.name === record.game_name);
				if (existingGames.length > 0) {
					game = existingGames[0];
				} else {
					game = this.db.games.create({ name: record.game_name });
				}
				gameCache.set(record.game_name, game);
			}

			// Ensure category exists
			let category = categoryCache.get(record.category_name);
			if (!category) {
				const existingCategories = this.db.categories
					.getAll()
					.filter((c) => c.name === record.category_name);
				if (existingCategories.length > 0) {
					category = existingCategories[0];
				} else {
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
				.filter(
					(e) =>
						e.reading === record.reading &&
						e.word === record.word &&
						e.category_id === category.id,
				);

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
	getSuggestedPaths(gameId?: number): {
		gitCsv: string;
		googleCsv: string;
		msCsv: string;
		atokCsv: string;
	} {
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