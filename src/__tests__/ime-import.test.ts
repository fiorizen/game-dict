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
			code: `testimport${uniqueSuffix}`,
		});
		gameId = game.id;
	});

	it("should import valid IME text file", async () => {
		// Create test IME file
		const testFile = path.join(testImportPath, "valid.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\t人名\nさしすせそ\tサシスセソ\t品詞なし";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(3);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(3);

		// Check specific entries
		const aiueo = entries.find((e) => e.reading === "あいうえお");
		expect(aiueo?.word).toBe("アイウエオ");

		const category = db.categories.getById(aiueo?.category_id);
		expect(category?.name).toBe("名詞");
	});

	it("should skip duplicate entries", async () => {
		// Create initial entry
		const category = db.categories.getAll().find((c) => c.name === "名詞");
		if (!category) {
			throw new Error("名詞 category not found");
		}
		db.entries.create({
			game_id: gameId,
			category_id: category.id,
			reading: "あいうえお",
			word: "アイウエオ",
			description: undefined,
		});

		// Create test file with duplicate entry
		const testFile = path.join(testImportPath, "duplicate.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\t人名";
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
		const newCategory = categories.find((c) => c.name === "新カテゴリ");
		expect(newCategory).toBeDefined();
		expect(newCategory?.google_ime_name).toBe("名詞");
		expect(newCategory?.ms_ime_name).toBe("名詞");
		expect(newCategory?.atok_name).toBe("名詞");
	});

	it("should reject file with invalid format lines", async () => {
		const testFile = path.join(testImportPath, "invalid.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\nさしすせそ\tサシスセソ\t人名\tコメント\t余分";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0]).toContain(
			"Line 2: Expected 3 or 4 tab-separated fields, got 2",
		);
		expect(result.errors[1]).toContain(
			"Line 3: Expected 3 or 4 tab-separated fields, got 5",
		);

		// Verify no entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(0);
	});

	it("should import valid 4-column IME text file with descriptions", async () => {
		// Create test IME file with 4 columns (4th column should be imported as description)
		const testFile = path.join(testImportPath, "valid4col.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\t#game_name\nかきくけこ\tカキクケコ\t人名\t#character\nさしすせそ\tサシスセソ\t品詞なし\t#other";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(3);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(3);

		// Check specific entries (4th column should be imported as description)
		const aiueo = entries.find((e) => e.reading === "あいうえお");
		expect(aiueo?.word).toBe("アイウエオ");
		expect(aiueo?.description).toBe("#game_name");

		const kakikukeko = entries.find((e) => e.reading === "かきくけこ");
		expect(kakikukeko?.word).toBe("カキクケコ");
		expect(kakikukeko?.description).toBe("#character");

		const sashisuseso = entries.find((e) => e.reading === "さしすせそ");
		expect(sashisuseso?.word).toBe("サシスセソ");
		expect(sashisuseso?.description).toBe("#other");

		const category = db.categories.getById(aiueo?.category_id);
		expect(category?.name).toBe("名詞");
	});

	it("should import mixed 3-column and 4-column format file", async () => {
		// Create test file with mixed 3 and 4 column formats
		const testFile = path.join(testImportPath, "mixed.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\nかきくけこ\tカキクケコ\t人名\t#character\nさしすせそ\tサシスセソ\t品詞なし";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(3);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify all entries were created regardless of column count
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(3);

		// Check mixed format handling
		const aiueo = entries.find((e) => e.reading === "あいうえお");
		expect(aiueo?.description).toBeNull(); // 3-column format, no description

		const kakikukeko = entries.find((e) => e.reading === "かきくけこ");
		expect(kakikukeko?.description).toBe("#character"); // 4-column format, has description

		const sashisuseso = entries.find((e) => e.reading === "さしすせそ");
		expect(sashisuseso?.description).toBeNull(); // 3-column format, no description
	});

	it("should reject file with empty fields", async () => {
		const testFile = path.join(testImportPath, "empty.txt");
		const content =
			"あいうえお\t\t名詞\nかきくけこ\tカキクケコ\t\n\tサシスセソ\t人名";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should throw error for non-existent file", async () => {
		const nonExistentFile = path.join(testImportPath, "nonexistent.txt");

		await expect(
			csvHandlers.importFromImeTxt(gameId, nonExistentFile),
		).rejects.toThrow("File not found");
	});

	it("should throw error for non-existent game", async () => {
		const testFile = path.join(testImportPath, "test.txt");
		const content = "あいうえお\tアイウエオ\t名詞";
		fs.writeFileSync(testFile, content, "utf-8");

		await expect(csvHandlers.importFromImeTxt(999, testFile)).rejects.toThrow(
			"Game with ID 999 not found",
		);
	});

	it("should handle completely unknown category names correctly", async () => {
		// Create test file with completely unknown category
		const testFile = path.join(testImportPath, "unknown-category.txt");
		const content =
			"あいうえお\tアイウエオ\t未知カテゴリ\nかきくけこ\tカキクケコ\t存在しないカテゴリ";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(2);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify entries were created
		const entries = db.entries.getByGameId(gameId);
		const newEntries = entries.filter(
			(e) => e.reading === "あいうえお" || e.reading === "かきくけこ",
		);
		expect(newEntries).toHaveLength(2);

		// Check that new categories were created with 名詞 as default IME mapping
		const categories = db.categories.getAll();
		const unknownCategory1 = categories.find((c) => c.name === "未知カテゴリ");
		const unknownCategory2 = categories.find(
			(c) => c.name === "存在しないカテゴリ",
		);

		expect(unknownCategory1).toBeDefined();
		expect(unknownCategory1?.google_ime_name).toBe("名詞");
		expect(unknownCategory1?.ms_ime_name).toBe("名詞");
		expect(unknownCategory1?.atok_name).toBe("名詞");

		expect(unknownCategory2).toBeDefined();
		expect(unknownCategory2?.google_ime_name).toBe("名詞");
		expect(unknownCategory2?.ms_ime_name).toBe("名詞");
		expect(unknownCategory2?.atok_name).toBe("名詞");

		// Verify entries are linked to the correct categories
		const entry1 = newEntries.find((e) => e.reading === "あいうえお");
		const entry2 = newEntries.find((e) => e.reading === "かきくけこ");

		expect(entry1?.category_id).toBe(unknownCategory1?.id);
		expect(entry2?.category_id).toBe(unknownCategory2?.id);
	});

	it("should handle empty 4th columns gracefully", async () => {
		// Create test file with empty 4th columns
		const testFile = path.join(testImportPath, "empty4col.txt");
		const content =
			"あいうえお\tアイウエオ\t名詞\t\nかきくけこ\tカキクケコ\t人名\t   \nさしすせそ\tサシスセソ\t品詞なし\t有効な説明";
		fs.writeFileSync(testFile, content, "utf-8");

		const result = await csvHandlers.importFromImeTxt(gameId, testFile);

		expect(result.imported).toBe(3);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);

		// Verify entries were created
		const entries = db.entries.getByGameId(gameId);
		expect(entries).toHaveLength(3);

		// Check empty description handling
		const aiueo = entries.find((e) => e.reading === "あいうえお");
		expect(aiueo?.description).toBeNull(); // Empty string becomes null

		const kakikukeko = entries.find((e) => e.reading === "かきくけこ");
		expect(kakikukeko?.description).toBeNull(); // Whitespace-only becomes null

		const sashisuseso = entries.find((e) => e.reading === "さしすせそ");
		expect(sashisuseso?.description).toBe("有効な説明"); // Valid description
	});
});
