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

		// Verify format: reading \t word \t category_name (order may vary)
		// Note: All entries use "人名" category due to test helper defaults
		const validLines = [
			"てすと\tテスト\t名詞",
			"げーむ\tゲーム\t名詞",
			"たろう\t太郎\t人名",
			"てすと\tテスト\t人名",
			"げーむ\tゲーム\t人名",
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
		// Note: Both categories now have msImeName = "名詞"
		const expectedLines = [
			"めいし\t名詞\t名詞", // Uses ms_ime_name
			"むかてごり\t無カテゴリ\t名詞", // Uses ms_ime_name or fallback
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
});
