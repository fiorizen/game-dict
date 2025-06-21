import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Database } from "../database/index.js";

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
		const game = db.games.create({ name: "Test Game" });

		expect(game.id).toBeGreaterThan(0);
		expect(game.name).toBe("Test Game");
		expect(game.created_at).toBeTruthy();
		expect(game.updated_at).toBeTruthy();
	});

	it("should prevent duplicate game names", () => {
		expect(() => {
			db.games.create({ name: "Test Game" });
		}).toThrow();
	});

	it("should update game name", () => {
		const games = db.games.getAll();
		const firstGame = games[0];
		const updated = db.games.update(firstGame.id, { name: "Updated Game" });

		expect(updated).toBeDefined();
		expect(updated?.name).toBe("Updated Game");
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
		const games = db.games.getAll();
		const categories = db.categories.getAll();

		const entry = db.entries.create({
			game_id: games[0].id,
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
		const games = db.games.getAll();
		const categories = db.categories.getAll();

		db.entries.create({
			game_id: games[0].id,
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
		const entries = db.entries.getAll();
		const entry = entries[0];

		const updated = db.entries.update(entry.id, {
			description: "Updated description",
		});

		expect(updated?.description).toBe("Updated description");
	});

	it("should handle bulk inserts efficiently", () => {
		const games = db.games.getAll();
		const categories = db.categories.getAll();

		const startTime = Date.now();

		for (let i = 0; i < 100; i++) {
			db.entries.create({
				game_id: games[0].id,
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
