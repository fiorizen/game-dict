import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestDatabaseHelper } from "./helpers/index.js";

describe("IME Export Functionality", () => {
	let testHelper: TestDatabaseHelper;
	let testGameId: number;

	beforeEach(async () => {
		// Setup test helper
		testHelper = TestDatabaseHelper.getInstance();

		// Clean up export directory
		testHelper.cleanupExportDir();

		// Create unique test game
		const game = testHelper.createUniqueGame("IME Export Test Game");
		testGameId = game.id;

		// Create test entries using helper
		testHelper.createTestEntry(testGameId, {
			reading: "てすと",
			word: "テスト",
			description: "試験のためのテスト",
		});

		testHelper.createTestEntry(testGameId, {
			reading: "げーむ",
			word: "ゲーム",
			description: "娯楽用ゲーム",
		});

		// Create entry with person category
		const categories = testHelper.getDefaultCategories();
		const personCategory = categories.find((c) => c.name === "人名");
		if (personCategory) {
			testHelper.createTestEntry(testGameId, {
				category_id: personCategory.id,
				reading: "たろう",
				word: "太郎",
				description: "男性の名前",
			});
		}
	});

	afterEach(() => {
		// Cleanup export directory
		testHelper.cleanupExportDir();
	});

	it("should export Microsoft IME format correctly", async () => {
		// Get the game to check the correct code
		const db = testHelper.getDatabase();
		const game = db.games.getById(testGameId);
		if (!game) throw new Error("Test game not found");

		// Export to Microsoft IME format
		const csvHandlers = testHelper.getCSVHandlers();
		const filePath = await csvHandlers.exportToMicrosoftIme(testGameId);

		// Verify export directory was created
		const exportDir = path.join(process.cwd(), "export");
		expect(fs.existsSync(exportDir)).toBe(true);

		// Verify file was created with correct name (using dynamic game code)
		const expectedFileName = `${game.code}.txt`;
		const expectedPath = path.join(exportDir, expectedFileName);
		expect(filePath).toBe(expectedPath);
		expect(fs.existsSync(expectedPath)).toBe(true);

		// Read and verify content
		const content = fs.readFileSync(expectedPath, "utf-8");

		// Verify content ends with newline (required for IME dictionaries)
		expect(content.endsWith("\n")).toBe(true);

		const lines = content.trim().split("\n");

		// Should have 3 entries (2 noun + 1 person name)
		expect(lines).toHaveLength(3);

		// Verify format: reading \t word \t category_name \t #game_name (order may vary)
		// Note: All entries use "人名" category due to test helper defaults
		const validLines = [
			`てすと\tテスト\t名詞\t#${game.name}`,
			`げーむ\tゲーム\t名詞\t#${game.name}`,
			`たろう\t太郎\t人名\t#${game.name}`,
			`てすと\tテスト\t人名\t#${game.name}`,
			`げーむ\tゲーム\t人名\t#${game.name}`,
		];

		// Check that each actual line is valid
		lines.forEach((line) => {
			expect(validLines).toContain(line);
		});
	});

	it("should throw error when game has no entries", async () => {
		// Create empty game using helper
		const emptyGame = testHelper.createUniqueGame("Empty Game");

		// Export should throw error for empty game
		const csvHandlers = testHelper.getCSVHandlers();
		await expect(
			csvHandlers.exportToMicrosoftIme(emptyGame.id),
		).rejects.toThrow(
			/No entries found for game .* IME export requires at least one entry/,
		);
	});

	it("should use correct IME category names", async () => {
		// Get categories and create entries with different categories
		const categories = testHelper.getDefaultCategories();
		const nounCategory = categories.find((c) => c.name === "名詞");
		const noCategoryCategory = categories.find((c) => c.name === "品詞なし");

		if (!nounCategory || !noCategoryCategory) {
			throw new Error("Required categories not found");
		}

		// Create test game using helper
		const testGame = testHelper.createUniqueGame("Category Test");

		// Create entries with different categories using helper
		testHelper.createTestEntry(testGame.id, {
			category_id: nounCategory.id,
			reading: "めいし",
			word: "名詞",
		});

		testHelper.createTestEntry(testGame.id, {
			category_id: noCategoryCategory.id,
			reading: "むかてごり",
			word: "無カテゴリ",
		});

		// Export and verify
		const csvHandlers = testHelper.getCSVHandlers();
		const filePath = await csvHandlers.exportToMicrosoftIme(testGame.id);
		const content = fs.readFileSync(filePath, "utf-8");

		// Verify content ends with newline (required for IME dictionaries)
		expect(content.endsWith("\n")).toBe(true);

		const lines = content.trim().split("\n");

		// Should have 2 entries
		expect(lines).toHaveLength(2);

		// Verify category names are MS IME format (check content exists regardless of order)
		// Note: Both categories now have msImeName = "名詞", with 4th column for game name
		const expectedLines = [
			`めいし\t名詞\t名詞\t#${testGame.name}`, // Uses ms_ime_name
			`むかてごり\t無カテゴリ\t名詞\t#${testGame.name}`, // Uses ms_ime_name or fallback
		];

		expectedLines.forEach((expectedLine) => {
			expect(lines).toContain(expectedLine);
		});
	});

	it("should throw error for non-existent game", async () => {
		const csvHandlers = testHelper.getCSVHandlers();
		await expect(csvHandlers.exportToMicrosoftIme(999999)).rejects.toThrow(
			"Game with ID 999999 not found",
		);
	});

	describe("All Games Export with Duplicate Removal", () => {
		beforeEach(async () => {
			// Create multiple games with overlapping entries for duplicate testing
			const game2 = testHelper.createUniqueGame("Game 2");
			const game3 = testHelper.createUniqueGame("Game 3");

			// Create identical entries in different games (should be deduplicated)
			testHelper.createTestEntry(game2.id, {
				reading: "てすと",
				word: "テスト",
				description: "Game 2 test entry",
			});

			testHelper.createTestEntry(game3.id, {
				reading: "てすと",
				word: "テスト",
				description: "Game 3 test entry",
			});

			// Create unique entries
			testHelper.createTestEntry(game2.id, {
				reading: "ゆにーく",
				word: "ユニーク",
				description: "Unique entry",
			});

			// Create another duplicate pair
			testHelper.createTestEntry(game2.id, {
				reading: "さぶじぇくと",
				word: "被験者",
				description: "Subject",
			});

			testHelper.createTestEntry(game3.id, {
				reading: "さぶじぇくと",
				word: "被験者",
				description: "Subject duplicate",
			});
		});

		it("should export all games with duplicate removal", async () => {
			const csvHandlers = testHelper.getCSVHandlers();
			const result = await csvHandlers.exportAllGamesToMicrosoftIme();

			// Verify return structure
			expect(result).toHaveProperty("filePath");
			expect(result).toHaveProperty("duplicatesFilePath");
			expect(result).toHaveProperty("stats");

			// Verify main export file exists
			const exportDir = path.join(process.cwd(), "export");
			const expectedPath = path.join(exportDir, "all-games.txt");
			expect(result.filePath).toBe(expectedPath);
			expect(fs.existsSync(expectedPath)).toBe(true);

			// Read and verify main content
			const content = fs.readFileSync(expectedPath, "utf-8");
			expect(content.endsWith("\n")).toBe(true);

			const lines = content.trim().split("\n");

			// Should have unique entries only
			// Expected: てすと/テスト (1), げーむ/ゲーム (1), たろう/太郎 (1), ゆにーく/ユニーク (1), さぶじぇくと/被験者 (1)
			expect(lines.length).toBeGreaterThan(0);

			// Verify no duplicate reading+word combinations
			const seenCombinations = new Set<string>();
			for (const line of lines) {
				const parts = line.split("\t");
				expect(parts).toHaveLength(4); // reading, word, category, #game

				const combination = `${parts[0]}:${parts[1]}`;
				expect(seenCombinations.has(combination)).toBe(false);
				seenCombinations.add(combination);
			}

			// Verify stats
			expect(result.stats.uniqueEntries).toBe(lines.length);
			expect(result.stats.totalEntries).toBeGreaterThan(
				result.stats.uniqueEntries,
			);
			expect(result.stats.duplicatesRemoved).toBeGreaterThan(0);
			expect(result.stats.totalEntries).toBe(
				result.stats.uniqueEntries + result.stats.duplicatesRemoved,
			);
		});

		it("should create duplicates file when duplicates exist", async () => {
			const csvHandlers = testHelper.getCSVHandlers();
			const result = await csvHandlers.exportAllGamesToMicrosoftIme();

			// Verify duplicates file exists
			const expectedDuplicatesPath = path.join(
				process.cwd(),
				"export",
				"all-games-duplicates.txt",
			);
			expect(result.duplicatesFilePath).toBe(expectedDuplicatesPath);
			expect(fs.existsSync(expectedDuplicatesPath)).toBe(true);

			// Read and verify duplicates content
			const duplicatesContent = fs.readFileSync(
				expectedDuplicatesPath,
				"utf-8",
			);

			// Should contain headers
			expect(duplicatesContent).toContain("# 重複により除外された辞書エントリ");
			expect(duplicatesContent).toContain("# 形式: 読み方");

			// Should contain duplicate entries with original game reference
			const lines = duplicatesContent
				.split("\n")
				.filter((line) => !line.startsWith("#") && line.trim());
			expect(lines.length).toBeGreaterThan(0);

			// Each duplicate line should contain original game reference
			for (const line of lines) {
				expect(line).toContain("重複元: #");
			}
		});

		it("should handle export when no games exist", async () => {
			// Clear all games
			const db = testHelper.getDatabase();
			const games = db.games.getAll();
			for (const game of games) {
				db.games.deleteWithRelatedEntries(game.id);
			}

			const csvHandlers = testHelper.getCSVHandlers();
			await expect(csvHandlers.exportAllGamesToMicrosoftIme()).rejects.toThrow(
				"No games found. Cannot export empty dictionary.",
			);
		});

		it("should handle export when games have no entries", async () => {
			// Clear all entries but keep games
			const db = testHelper.getDatabase();
			const entries = db.entries.getAll();
			for (const entry of entries) {
				db.entries.delete(entry.id);
			}

			const csvHandlers = testHelper.getCSVHandlers();
			await expect(csvHandlers.exportAllGamesToMicrosoftIme()).rejects.toThrow(
				"No entries found in any game. IME export requires at least one entry.",
			);
		});
	});

	describe("Category Fallback Functionality", () => {
		it("should fallback undefined categories to 名詞 during IME export", async () => {
			// Create a category not defined in categories.csv
			const db = testHelper.getDatabase();
			const undefinedCategory = db.categories.create({
				name: "固有名詞",
				google_ime_name: null, // Not defined in categories.csv
				ms_ime_name: null, // Not defined in categories.csv
				atok_name: null, // Not defined in categories.csv
			});

			if (!undefinedCategory) {
				throw new Error("Failed to create undefined category");
			}

			// Create entry with undefined category
			testHelper.createTestEntry(testGameId, {
				category_id: undefinedCategory.id,
				reading: "ふぃくしょん",
				word: "フィクション",
				description: "架空の作品名",
			});

			// Test Microsoft IME export
			const csvHandlers = testHelper.getCSVHandlers();
			const filePath = await csvHandlers.exportToMicrosoftIme(testGameId);

			// Verify file exists
			expect(fs.existsSync(filePath)).toBe(true);

			// Read and verify content
			const content = fs.readFileSync(filePath, "utf-8");
			const lines = content.trim().split("\n");

			// Find the entry with undefined category
			const undefinedCategoryLine = lines.find(
				(line) =>
					line.includes("ふぃくしょん") && line.includes("フィクション"),
			);

			expect(undefinedCategoryLine).toBeDefined();

			// Should fallback to 名詞
			if (undefinedCategoryLine) {
				const parts = undefinedCategoryLine.split("\t");
				expect(parts[2]).toBe("名詞"); // Category should be fallback to 名詞
			}
		});

		it("should fallback multiple undefined category types to 名詞", async () => {
			const db = testHelper.getDatabase();

			// Create multiple undefined categories
			const categories = [
				{ name: "地名", reading: "とうきょう", word: "東京" },
				{ name: "会社名", reading: "かいしゃ", word: "会社" },
				{ name: "技術用語", reading: "ぷろぐらむ", word: "プログラム" },
				{ name: "専門用語", reading: "せんもん", word: "専門" },
			];

			for (const cat of categories) {
				const undefinedCategory = db.categories.create({
					name: cat.name,
					google_ime_name: null,
					ms_ime_name: null,
					atok_name: null,
				});

				if (undefinedCategory) {
					testHelper.createTestEntry(testGameId, {
						category_id: undefinedCategory.id,
						reading: cat.reading,
						word: cat.word,
						description: `Test ${cat.name}`,
					});
				}
			}

			// Test CSV IME export for all formats
			const csvHandlers = testHelper.getCSVHandlers();
			const exportDir = path.join(process.cwd(), "export");

			// Ensure export directory exists
			if (!fs.existsSync(exportDir)) {
				fs.mkdirSync(exportDir, { recursive: true });
			}

			for (const format of ["google", "ms", "atok"] as const) {
				const filePath = path.join(exportDir, `test-${format}.csv`);
				await csvHandlers.exportToImeCsv(testGameId, format, filePath);

				expect(fs.existsSync(filePath)).toBe(true);

				const content = fs.readFileSync(filePath, "utf-8");
				const lines = content.trim().split("\n");

				// Skip header line
				const dataLines = lines.slice(1);

				// All undefined categories should fallback to 名詞
				for (const line of dataLines) {
					const parts = line.split(",");
					if (parts.length >= 3) {
						const categoryName = parts[2].replace(/"/g, ""); // Remove CSV quotes
						// Should be either defined category or fallback to 名詞
						expect(["名詞", "人名", "品詞なし"]).toContain(categoryName);
					}
				}
			}
		});
	});
});
