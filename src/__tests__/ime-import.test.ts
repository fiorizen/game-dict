import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Database } from "../database/index.js";
import { CSVHandlers } from "../main/csv-handlers.js";

// Setup test environment
const testDataPath = path.join(process.cwd(), "test-data");
const testImportPath = path.join(testDataPath, "import");

beforeAll(() => {
	// Clean test data before all tests
	if (fs.existsSync(testDataPath)) {
		fs.rmSync(testDataPath, { recursive: true, force: true });
	}
	fs.mkdirSync(testImportPath, { recursive: true });
});

describe("IME Import Functionality", () => {
	let db: Database;
	let csvHandlers: CSVHandlers;
	let gameId: number;

	beforeEach(() => {
		// Reset database instance
		Database.resetInstance();
		db = Database.getInstance();
		csvHandlers = new CSVHandlers();
		
		// Create test game with unique name
		const uniqueSuffix = Date.now().toString().slice(-6);
		const game = db.games.create({ 
			name: `Test Import Game ${uniqueSuffix}`, 
			code: `testimport${uniqueSuffix}` 
		});
		gameId = game.id;
	});

	it("should import valid IME text file", async () => {
		// Create test IME file
		const testFile = path.join(testImportPath, "valid.txt");
		const content = "あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\t人名\nさしすせそ\tサシスセソ\t品詞なし";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(3);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(3);
		
		// Check specific entries
		const aiueo = entries.find(e => e.reading === "あいうえお");
		expect(aiueo?.word).toBe("アイウエオ");
		
		const category = db.categories.getById(aiueo!.category_id);
		expect(category?.name).toBe("名詞");
	});

	it("should skip duplicate entries", async () => {
		// Create initial entry
		const category = db.categories.getAll().find(c => c.name === "名詞")!;
		db.entries.create({
			game_id: gameId,
			category_id: category.id,
			reading: "あいうえお",
			word: "アイウエオ",
			description: undefined,
		});

		// Create test file with duplicate entry
		const testFile = path.join(testImportPath, "duplicate.txt");
		const content = "あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\t人名";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(1); // Only the new entry
		expect(result.skipped).toBe(1); // The duplicate
		expect(result.errors).toHaveLength(0);
	});

	it("should create new categories with 名詞 as default IME mapping", async () => {
		const testFile = path.join(testImportPath, "newcategory.txt");
		const content = "あいうえお\tアイウエオ\t新カテゴリ";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(1);
		expect(result.errors).toHaveLength(0);

		// Verify new category was created with correct defaults
		const categories = db.categories.getAll();
		const newCategory = categories.find(c => c.name === "新カテゴリ");
		expect(newCategory).toBeDefined();
		expect(newCategory!.google_ime_name).toBe("名詞");
		expect(newCategory!.ms_ime_name).toBe("名詞");
		expect(newCategory!.atok_name).toBe("名詞");
	});

	it("should reject file with invalid format lines", async () => {
		const testFile = path.join(testImportPath, "invalid.txt");
		const content = "あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\nさしすせそ\tサシスセソ\t人名\tエラー";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0]).toContain("Line 2: Expected 3 tab-separated fields, got 2");
		expect(result.errors[1]).toContain("Line 3: Expected 3 tab-separated fields, got 4");

		// Verify no entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(0);
	});

	it("should reject file with empty fields", async () => {
		const testFile = path.join(testImportPath, "empty.txt");
		const content = "あいうえお\t\t名詞\nかきくけこ\tカキクケコ\t\n\tサシスセソ\t人名";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should throw error for non-existent file", async () => {
		const nonExistentFile = path.join(testImportPath, "nonexistent.txt");
		
		await expect(csvHandlers.importFromImeTxt(gameId, nonExistentFile))
			.rejects.toThrow("File not found");
	});

	it("should throw error for non-existent game", async () => {
		const testFile = path.join(testImportPath, "test.txt");
		const content = "あいうえお\tアイウエオ\t名詞";
		fs.writeFileSync(testFile, content, "utf-8");

		await expect(csvHandlers.importFromImeTxt(999, testFile))
			.rejects.toThrow("Game with ID 999 not found");
	});
});