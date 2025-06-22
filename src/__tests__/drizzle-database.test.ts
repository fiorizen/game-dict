import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DrizzleDatabase } from "../database/drizzle-database.js";
import fs from "node:fs";
import path from "node:path";

describe("Drizzle Database Tests", () => {
	let db: DrizzleDatabase;
	const testDbPath = path.join(process.cwd(), "test-data", "game-dict-test.db");

	beforeEach(() => {
		// Remove existing test database
		if (fs.existsSync(testDbPath)) {
			fs.unlinkSync(testDbPath);
		}
		
		// Reset the database instance before each test
		DrizzleDatabase.resetInstance();
		db = DrizzleDatabase.getInstance();
	});

	afterEach(() => {
		// Clean up after each test
		if (db) {
			db.close();
		}
		DrizzleDatabase.resetInstance();
		
		// Remove test database
		if (fs.existsSync(testDbPath)) {
			fs.unlinkSync(testDbPath);
		}
	});

	it("should create database instance", () => {
		expect(db).toBeDefined();
		expect(db.games).toBeDefined();
		expect(db.categories).toBeDefined();
		expect(db.entries).toBeDefined();
	});

	it("should have default categories", () => {
		const categories = db.categories.getAll();
		expect(categories.length).toBe(3);
		
		const categoryNames = categories.map(c => c.name);
		expect(categoryNames).toContain("名詞");
		expect(categoryNames).toContain("品詞なし");
		expect(categoryNames).toContain("人名");
	});

	it("should create and retrieve a game", () => {
		const game = db.games.create({ name: "Test Game" });
		
		expect(game.id).toBeGreaterThan(0);
		expect(game.name).toBe("Test Game");
		expect(game.createdAt).toBeDefined();
		expect(game.updatedAt).toBeDefined();

		const retrieved = db.games.getById(game.id);
		expect(retrieved).toEqual(game);
	});

	it("should get all games", () => {
		db.games.create({ name: "Game 1" });
		db.games.create({ name: "Game 2" });
		
		const games = db.games.getAll();
		expect(games.length).toBe(2);
		expect(games[0].name).toBe("Game 1");
		expect(games[1].name).toBe("Game 2");
	});
});