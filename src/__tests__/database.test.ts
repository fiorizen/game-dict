import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Database } from "../database/index.js";
import { CSVHandlers } from "../main/csv-handlers.js";

// Setup test environment
const testDataPath = path.join(process.cwd(), "test-data");

beforeAll(() => {
	// Clean test data before all tests
	if (fs.existsSync(testDataPath)) {
		fs.rmSync(testDataPath, { recursive: true, force: true });
	}
});

describe("SQLite Database Tests", () => {
	let db: Database;

	it("should create database instance", () => {
		db = Database.getInstance();
		expect(db).toBeDefined();
	});

	it("should create a new game", () => {
		const game = db.games.create({ name: "Test Game", code: "testgame" });

		expect(game.id).toBeGreaterThan(0);
		expect(game.name).toBe("Test Game");
		expect(game.code).toBe("testgame");
		expect(game.created_at).toBeTruthy();
		expect(game.updated_at).toBeTruthy();
	});

	it("should prevent duplicate game names", () => {
		expect(() => {
			db.games.create({ name: "Test Game", code: "testgame2" });
		}).toThrow();
	});

	it("should prevent duplicate game codes", () => {
		expect(() => {
			db.games.create({ name: "Test Game 2", code: "testgame" });
		}).toThrow();
	});

	it("should validate game code format", () => {
		expect(() => {
			db.games.create({ name: "Invalid Code Game", code: "invalid-code!" });
		}).toThrow("Invalid game code");

		expect(() => {
			db.games.create({ name: "Too Long Code Game", code: "thisgamecodeistoolongforvalidation" });
		}).toThrow("Invalid game code");

		expect(() => {
			db.games.create({ name: "Empty Code Game", code: "" });
		}).toThrow("Invalid game code");
	});

	it("should update game name", () => {
		const games = db.games.getAll();
		const firstGame = games[0];
		const updated = db.games.update(firstGame.id, { name: "Updated Game", code: "updatedgame" });

		expect(updated).toBeDefined();
		expect(updated?.name).toBe("Updated Game");
		expect(updated?.code).toBe("updatedgame");
	});

	it("should have default categories", () => {
		const categories = db.categories.getAll();

		expect(categories.length).toBe(3);

		// 名詞カテゴリ
		const nounCategory = categories.find((c) => c.name === "名詞");
		expect(nounCategory).toBeDefined();
		expect(nounCategory?.google_ime_name).toBe("一般");

		// 品詞なしカテゴリ
		const noPartsCategory = categories.find((c) => c.name === "品詞なし");
		expect(noPartsCategory).toBeDefined();
		expect(noPartsCategory?.google_ime_name).toBe("一般");

		// 人名カテゴリ
		const personCategory = categories.find((c) => c.name === "人名");
		expect(personCategory).toBeDefined();
		expect(personCategory?.google_ime_name).toBe("人名");
	});

	it("should create custom category", () => {
		const category = db.categories.create({
			name: "カスタムカテゴリ",
			google_ime_name: "一般",
			ms_ime_name: "一般",
			atok_name: "一般",
		});

		expect(category.id).toBeGreaterThan(0);
		expect(category.name).toBe("カスタムカテゴリ");
		expect(category.google_ime_name).toBe("一般");
	});

	it("should create entry", () => {
		// Ensure we have a game for this test
		const testGame = db.games.create({ name: "Entry Test Game", code: "entrytestgame" });
		const categories = db.categories.getAll();

		const entry = db.entries.create({
			game_id: testGame.id,
			category_id: categories[0].id,
			reading: "てすと",
			word: "テスト",
			description: "テスト用エントリ",
		});

		expect(entry.id).toBeGreaterThan(0);
		expect(entry.reading).toBe("てすと");
		expect(entry.word).toBe("テスト");
		expect(entry.description).toBe("テスト用エントリ");
	});

	it("should search entries", () => {
		// Ensure we have a game for this test
		const testGame = db.games.create({ name: "Search Test Game", code: "searchtestgame" });
		const categories = db.categories.getAll();

		db.entries.create({
			game_id: testGame.id,
			category_id: categories[0].id,
			reading: "バハムート",
			word: "バハムート",
			description: "召喚獣",
		});

		const results = db.entries.search("バハ");
		expect(results.length).toBe(1);
		expect(results[0].word).toBe("バハムート");
		expect(results[0].game_name).toBeTruthy();
		expect(results[0].category_name).toBeTruthy();
	});

	it("should enforce foreign key constraints", () => {
		const categories = db.categories.getAll();

		expect(() => {
			db.entries.create({
				game_id: 99999,
				category_id: categories[0].id,
				reading: "invalid",
				word: "Invalid",
			});
		}).toThrow();
	});

	it("should update entry", () => {
		// Create a test game and entry for this test
		const testGame = db.games.create({ name: "Update Test Game", code: "updatetestgame" });
		const categories = db.categories.getAll();
		const entry = db.entries.create({
			game_id: testGame.id,
			category_id: categories[0].id,
			reading: "あっぷでーと",
			word: "アップデート",
			description: "Original description",
		});

		const updated = db.entries.update(entry.id, {
			description: "Updated description",
		});

		expect(updated?.description).toBe("Updated description");
	});

	it("should handle bulk inserts efficiently", () => {
		// Create a test game for bulk inserts
		const testGame = db.games.create({ name: "Bulk Test Game", code: "bulktestgame" });
		const categories = db.categories.getAll();

		const startTime = Date.now();

		for (let i = 0; i < 100; i++) {
			db.entries.create({
				game_id: testGame.id,
				category_id: categories[i % categories.length].id,
				reading: `テスト${i}`,
				word: `テスト${i}`,
				description: `パフォーマンステスト${i}`,
			});
		}

		const duration = Date.now() - startTime;
		expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
	});

	it("should search efficiently", () => {
		const startTime = Date.now();
		const results = db.entries.search("テスト");
		const duration = Date.now() - startTime;

		expect(results.length).toBeGreaterThanOrEqual(100);
		expect(duration).toBeLessThan(100); // Should search in under 100ms
	});
});

describe("CSV Export/Import Tests", () => {
	let db: Database;
	let csvHandlers: CSVHandlers;
	const testCsvDir = path.join(testDataPath, "csv");

	it("should initialize CSV handlers", () => {
		db = Database.getInstance();
		csvHandlers = new CSVHandlers();
		expect(csvHandlers).toBeDefined();
		
		// Ensure test CSV directory exists
		if (!fs.existsSync(testCsvDir)) {
			fs.mkdirSync(testCsvDir, { recursive: true });
		}
	});

	it("should export games to Git CSV format", async () => {
		// Create test game with entries
		const testGameName = "CSV Test Game";
		const game = db.games.create({ name: testGameName, code: "csvtestgame" });
		const categories = db.categories.getAll();
		
		// Find specific categories
		const nounCategory = categories.find(c => c.name === "名詞");
		const noPartsCategory = categories.find(c => c.name === "品詞なし");
		
		// Add some test entries
		db.entries.create({
			game_id: game.id,
			category_id: nounCategory!.id,
			reading: "てすと",
			word: "テスト",
			description: "テスト用エントリ",
		});
		
		db.entries.create({
			game_id: game.id,
			category_id: noPartsCategory!.id,
			reading: "でーた",
			word: "データ",
			description: "データエントリ",
		});

		// Export to CSV
		const exportedFiles = await csvHandlers.exportToGitCsv(testCsvDir);
		
		expect(exportedFiles.length).toBeGreaterThan(0);
		
		// Find the file for our test game (now uses code instead of ID)
		const gameFile = exportedFiles.find(file => file.includes(`game-${game.code}.csv`));
		expect(gameFile).toBeDefined();
		
		// Verify file exists and has content
		expect(fs.existsSync(gameFile!)).toBe(true);
		
		const csvContent = fs.readFileSync(gameFile!, "utf-8");
		expect(csvContent).toContain(`# Game: ${testGameName} (Code: ${game.code})`);
		expect(csvContent).toContain("category_name,reading,word,description");
		expect(csvContent).toContain("てすと,テスト");
		expect(csvContent).toContain("でーた,データ");
		expect(csvContent).toContain("名詞");
		expect(csvContent).toContain("品詞なし");
	});

	it("should import CSV data back to database", async () => {
		// Ensure test CSV directory exists
		if (!fs.existsSync(testCsvDir)) {
			fs.mkdirSync(testCsvDir, { recursive: true });
		}

		// Create a test CSV file
		const testCsvFile = path.join(testCsvDir, "import-test.csv");
		const testGameName = "CSV Import Test Game";
		const csvContent = `# Game: ${testGameName} (Code: csvimporttest)
category_name,reading,word,description
名詞,いんぽーと,インポート,インポートテスト
人名,てすとじん,テスト人,テスト用の人名
品詞なし,あいてむ,アイテム,アイテム説明`;

		fs.writeFileSync(testCsvFile, csvContent, "utf-8");

		// Count entries before import
		const entriesBeforeImport = db.entries.getAll();
		const gamesBeforeImport = db.games.getAll();

		// Import CSV
		await csvHandlers.importFromCsv(testCsvFile);

		// Verify import
		const gamesAfterImport = db.games.getAll();
		const entriesAfterImport = db.entries.getAll();

		// Check that new game was created (should have 1 more game)
		expect(gamesAfterImport.length).toBeGreaterThan(gamesBeforeImport.length);
		expect(entriesAfterImport.length).toBe(entriesBeforeImport.length + 3);

		// Find the imported game
		const importedGame = gamesAfterImport.find(g => g.name === testGameName);
		expect(importedGame).toBeDefined();

		// Verify imported entries
		const importedEntries = db.entries.getByGameId(importedGame!.id);
		expect(importedEntries.length).toBe(3);

		const importEntry = importedEntries.find(e => e.reading === "いんぽーと");
		expect(importEntry).toBeDefined();
		expect(importEntry!.word).toBe("インポート");
		expect(importEntry!.description).toBe("インポートテスト");

		const personEntry = importedEntries.find(e => e.reading === "てすとじん");
		expect(personEntry).toBeDefined();
		expect(personEntry!.word).toBe("テスト人");
	});

	it("should handle round-trip conversion (export -> import)", async () => {
		// Create a game with specific data
		const originalGameName = "Round Trip Test";
		const originalGame = db.games.create({ name: originalGameName, code: "roundtriptest" });
		const categories = db.categories.getAll();

		// Find specific categories
		const nounCategory = categories.find(c => c.name === "名詞");
		const personCategory = categories.find(c => c.name === "人名");

		const originalEntries = [
			{
				game_id: originalGame.id,
				category_id: nounCategory!.id,
				reading: "らうんど",
				word: "ラウンド",
				description: "ラウンドトリップテスト",
			},
			{
				game_id: originalGame.id,
				category_id: personCategory!.id,
				reading: "じんめい",
				word: "人名",
				description: "人名テスト",
			},
		];

		// Add entries
		originalEntries.forEach(entry => db.entries.create(entry));

		// Export to CSV
		const exportedFiles = await csvHandlers.exportToGitCsv(testCsvDir);
		const gameFile = exportedFiles.find(file => file.includes(`game-${originalGame.code}.csv`));
		expect(gameFile).toBeDefined();

		// Delete the original game and entries
		db.entries.getByGameId(originalGame.id).forEach(entry => {
			db.entries.delete(entry.id);
		});
		db.games.delete(originalGame.id);

		// Verify deletion
		expect(db.games.getById(originalGame.id)).toBeNull();
		expect(db.entries.getByGameId(originalGame.id).length).toBe(0);

		// Import back from CSV
		await csvHandlers.importFromCsv(gameFile!);

		// Verify round-trip
		const restoredGames = db.games.getAll().filter(g => g.name === originalGameName);
		expect(restoredGames.length).toBe(1);

		const restoredGame = restoredGames[0];
		const restoredEntries = db.entries.getByGameId(restoredGame.id);
		expect(restoredEntries.length).toBe(2);

		const roundEntry = restoredEntries.find(e => e.reading === "らうんど");
		expect(roundEntry).toBeDefined();
		expect(roundEntry!.word).toBe("ラウンド");
		expect(roundEntry!.description).toBe("ラウンドトリップテスト");

		const nameEntry = restoredEntries.find(e => e.reading === "じんめい");
		expect(nameEntry).toBeDefined();
		expect(nameEntry!.word).toBe("人名");
		expect(nameEntry!.description).toBe("人名テスト");
	});

	it("should handle empty games (no export)", async () => {
		// Create a game with no entries
		const emptyGame = db.games.create({ name: "Empty Game", code: "emptygame" });
		
		// Export to CSV
		const exportedFiles = await csvHandlers.exportToGitCsv(testCsvDir);
		
		// Should not create file for empty game
		const emptyGameFile = exportedFiles.find(file => file.includes(`game-${emptyGame.id}.csv`));
		expect(emptyGameFile).toBeUndefined();
	});

	it("should handle filename sanitization correctly", async () => {
		// Create game with special characters in name
		const specialGame = db.games.create({ name: "Special/Game:Test*Name", code: "specialgametest" });
		const categories = db.categories.getAll();
		const nounCategory = categories.find(c => c.name === "名詞");
		
		db.entries.create({
			game_id: specialGame.id,
			category_id: nounCategory!.id,
			reading: "すぺしゃる",
			word: "スペシャル",
			description: "特殊文字テスト",
		});

		// Export to CSV
		const exportedFiles = await csvHandlers.exportToGitCsv(testCsvDir);
		
		// File should use game code, not sanitized name
		const specialGameFile = exportedFiles.find(file => file.includes(`game-${specialGame.code}.csv`));
		expect(specialGameFile).toBeDefined();
		expect(fs.existsSync(specialGameFile!)).toBe(true);
		
		// Content should preserve original game name in comment
		const csvContent = fs.readFileSync(specialGameFile!, "utf-8");
		expect(csvContent).toContain(`# Game: Special/Game:Test*Name (Code: ${specialGame.code})`);
	});
});
