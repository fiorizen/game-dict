import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Database } from "../database/index.js";
import { CSVHandlers } from "../main/csv-handlers.js";

describe("IME Export Functionality", () => {
	let db: Database;
	let csvHandlers: CSVHandlers;
	let testGameId: number;
	let exportDir: string;

	beforeEach(async () => {
		// Setup test database
		db = Database.getInstance();
		csvHandlers = new CSVHandlers();
		exportDir = path.join(process.cwd(), 'export');

		// Clean up export directory
		if (fs.existsSync(exportDir)) {
			fs.rmSync(exportDir, { recursive: true });
		}

		// Create unique test game name for each test
		const uniqueId = Math.floor(Math.random() * 10000);
		const game = db.games.create({ 
			name: `テストゲーム-${uniqueId}`, 
			code: `test${uniqueId}` 
		});
		testGameId = game.id;

		// Get default categories
		const categories = db.categories.getAll();
		const nounCategory = categories.find(c => c.name === "名詞");
		
		if (!nounCategory) {
			throw new Error("Default noun category not found");
		}

		// Create test entries
		db.entries.create({
			game_id: testGameId,
			category_id: nounCategory.id,
			reading: "てすと",
			word: "テスト",
			description: "試験のためのテスト",
		});

		db.entries.create({
			game_id: testGameId,
			category_id: nounCategory.id,
			reading: "げーむ",
			word: "ゲーム",
			description: "娯楽用ゲーム",
		});
	});

	afterEach(() => {
		// Clean up export directory
		if (fs.existsSync(exportDir)) {
			fs.rmSync(exportDir, { recursive: true });
		}
		
		// Reset database
		Database.resetInstance();
	});

	it("should export Microsoft IME format correctly", async () => {
		// Get the game to check the correct code
		const game = db.games.getById(testGameId);
		if (!game) throw new Error("Test game not found");

		// Export to Microsoft IME format
		const filePath = await csvHandlers.exportToMicrosoftIme(testGameId);

		// Verify export directory was created
		expect(fs.existsSync(exportDir)).toBe(true);

		// Verify file was created with correct name (using dynamic game code)
		const expectedFileName = `${game.code}.txt`;
		const expectedPath = path.join(exportDir, expectedFileName);
		expect(filePath).toBe(expectedPath);
		expect(fs.existsSync(expectedPath)).toBe(true);

		// Read and verify content
		const content = fs.readFileSync(expectedPath, 'utf-8');
		const lines = content.trim().split('\n');

		// Should have 2 entries
		expect(lines).toHaveLength(2);

		// Verify format: reading \t word \t category_name (order may vary)
		// Note: Default "名詞" category has msImeName = "一般"
		const expectedLines = [
			"てすと\tテスト\t一般",
			"げーむ\tゲーム\t一般"
		];
		
		// Check that all expected lines are present (regardless of order)
		expectedLines.forEach(expectedLine => {
			expect(lines).toContain(expectedLine);
		});
	});

	it("should throw error when game has no entries", async () => {
		// Create empty game with unique name
		const uniqueId = Math.floor(Math.random() * 10000);
		const emptyGame = db.games.create({ 
			name: `空のゲーム-${uniqueId}`, 
			code: `empty${uniqueId}` 
		});

		// Export should throw error for empty game
		await expect(csvHandlers.exportToMicrosoftIme(emptyGame.id))
			.rejects
			.toThrow(/No entries found for game .* IME export requires at least one entry/);
	});

	it("should use correct IME category names", async () => {
		// Get categories and create entries with different categories
		const categories = db.categories.getAll();
		const nounCategory = categories.find(c => c.name === "名詞");
		const noCategoryCategory = categories.find(c => c.name === "品詞なし");
		
		if (!nounCategory || !noCategoryCategory) {
			throw new Error("Required categories not found");
		}

		// Create test game with unique name
		const uniqueId = Math.floor(Math.random() * 10000);
		const testGame = db.games.create({ 
			name: `カテゴリテスト-${uniqueId}`, 
			code: `cat${uniqueId}` 
		});

		// Create entries with different categories
		db.entries.create({
			game_id: testGame.id,
			category_id: nounCategory.id,
			reading: "めいし",
			word: "名詞",
		});

		db.entries.create({
			game_id: testGame.id,
			category_id: noCategoryCategory.id,
			reading: "むかてごり",
			word: "無カテゴリ",
		});

		// Export and verify
		const filePath = await csvHandlers.exportToMicrosoftIme(testGame.id);
		const content = fs.readFileSync(filePath, 'utf-8');
		const lines = content.trim().split('\n');

		// Should have 2 entries
		expect(lines).toHaveLength(2);

		// Verify category names are MS IME format (check content exists regardless of order)
		// Note: Both categories have msImeName = "一般" by default
		const expectedLines = [
			"めいし\t名詞\t一般",      // Uses ms_ime_name
			"むかてごり\t無カテゴリ\t一般"  // Uses ms_ime_name or fallback
		];
		
		expectedLines.forEach(expectedLine => {
			expect(lines).toContain(expectedLine);
		});
	});

	it("should throw error for non-existent game", async () => {
		await expect(csvHandlers.exportToMicrosoftIme(999999))
			.rejects
			.toThrow("Game with ID 999999 not found");
	});
});