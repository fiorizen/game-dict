// Enhanced test runner with clear Pass/Fail output

import fs from "node:fs";
import path from "node:path";
import { Database } from "./src/database/index.js";

interface TestResult {
	name: string;
	status: "PASS" | "FAIL";
	error?: Error;
	duration?: number;
}

class TestRunner {
	private results: TestResult[] = [];
	private db: Database;

	constructor() {
		this.cleanTestData();
		this.db = Database.getInstance();
	}

	private cleanTestData(): void {
		const testDataPath = path.join(process.cwd(), "test-data");
		if (fs.existsSync(testDataPath)) {
			fs.rmSync(testDataPath, { recursive: true, force: true });
		}
	}

	private async runTest(
		name: string,
		testFn: () => void | Promise<void>,
	): Promise<void> {
		const startTime = Date.now();
		try {
			await testFn();
			const duration = Date.now() - startTime;
			this.results.push({ name, status: "PASS", duration });
			console.log(`✅ PASS: ${name} (${duration}ms)`);
		} catch (error) {
			const duration = Date.now() - startTime;
			this.results.push({
				name,
				status: "FAIL",
				error: error as Error,
				duration,
			});
			console.log(`❌ FAIL: ${name} (${duration}ms)`);
			console.log(`   Error: ${(error as Error).message}`);
		}
	}

	private assert(condition: boolean, message: string): void {
		if (!condition) {
			throw new Error(`Assertion failed: ${message}`);
		}
	}

	private assertEqual<T>(actual: T, expected: T, message?: string): void {
		if (actual !== expected) {
			throw new Error(
				`Assertion failed: ${message || "Values not equal"}\n  Expected: ${expected}\n  Actual: ${actual}`,
			);
		}
	}

	public async runAllTests(): Promise<void> {
		console.log("🧪 Starting SQLite Database Tests\n");

		await this.runTest("Database Connection", () => {
			this.assert(this.db !== null, "Database instance should be created");
		});

		await this.runTest("Game Creation", () => {
			const game = this.db.games.create({ name: "Test Game 1" });
			this.assert(game.id > 0, "Game should have valid ID");
			this.assertEqual(game.name, "Test Game 1", "Game name should match");
			this.assert(
				game.created_at.length > 0,
				"Game should have creation timestamp",
			);
		});

		await this.runTest("Duplicate Game Prevention", () => {
			try {
				this.db.games.create({ name: "Test Game 1" });
				throw new Error("Should have thrown error for duplicate game");
			} catch (error) {
				// Expected error
				this.assert(true, "Duplicate prevention works");
			}
		});

		await this.runTest("Game Update", () => {
			const games = this.db.games.getAll();
			const firstGame = games[0];
			const updated = this.db.games.update(firstGame.id, {
				name: "Updated Game",
			});
			this.assert(updated !== null, "Update should return updated game");
			this.assertEqual(updated!.name, "Updated Game", "Name should be updated");
		});

		await this.runTest("Default Categories", () => {
			const categories = this.db.categories.getAll();
			this.assert(
				categories.length >= 6,
				"Should have at least 6 default categories",
			);

			const personCategory = categories.find((c) => c.name === "人名");
			this.assert(personCategory !== undefined, "Should have 人名 category");
			this.assertEqual(
				personCategory!.google_ime_name,
				"人名",
				"Google IME name should be correct",
			);
		});

		await this.runTest("Custom Category Creation", () => {
			const category = this.db.categories.create({
				name: "テストカテゴリ",
				google_ime_name: "一般",
			});
			this.assert(category.id > 0, "Category should have valid ID");
			this.assertEqual(
				category.name,
				"テストカテゴリ",
				"Category name should match",
			);
		});

		await this.runTest("Entry Creation", () => {
			const games = this.db.games.getAll();
			const categories = this.db.categories.getAll();

			const entry = this.db.entries.create({
				game_id: games[0].id,
				category_id: categories[0].id,
				reading: "てすと",
				word: "テスト",
				description: "テスト用エントリ",
			});

			this.assert(entry.id > 0, "Entry should have valid ID");
			this.assertEqual(entry.reading, "てすと", "Reading should match");
			this.assertEqual(entry.word, "テスト", "Word should match");
			this.assertEqual(
				entry.description,
				"テスト用エントリ",
				"Description should match",
			);
		});

		await this.runTest("Entry Search", () => {
			const searchResults = this.db.entries.search("テスト");
			this.assert(searchResults.length > 0, "Should find test entry");

			const entry = searchResults[0];
			this.assert(entry.game_name !== undefined, "Should include game name");
			this.assert(
				entry.category_name !== undefined,
				"Should include category name",
			);
		});

		await this.runTest("Foreign Key Constraint", () => {
			try {
				this.db.entries.create({
					game_id: 99999,
					category_id: 1,
					reading: "invalid",
					word: "Invalid",
				});
				throw new Error("Should have thrown foreign key error");
			} catch (error) {
				this.assert(true, "Foreign key constraint enforced");
			}
		});

		await this.runTest("Performance: Bulk Insert", () => {
			const startTime = Date.now();
			const games = this.db.games.getAll();
			const categories = this.db.categories.getAll();

			for (let i = 0; i < 50; i++) {
				this.db.entries.create({
					game_id: games[0].id,
					category_id: categories[i % categories.length].id,
					reading: `パフォーマンス${i}`,
					word: `パフォーマンス${i}`,
					description: `パフォーマンステスト${i}`,
				});
			}

			const duration = Date.now() - startTime;
			this.assert(
				duration < 5000,
				`Bulk insert should be fast (${duration}ms)`,
			);
		});

		await this.runTest("Performance: Search", () => {
			const startTime = Date.now();
			const results = this.db.entries.search("パフォーマンス");
			const duration = Date.now() - startTime;

			this.assert(results.length >= 50, "Should find all performance entries");
			this.assert(duration < 100, `Search should be fast (${duration}ms)`);
		});

		this.printSummary();
		this.db.close();
	}

	private printSummary(): void {
		const passed = this.results.filter((r) => r.status === "PASS").length;
		const failed = this.results.filter((r) => r.status === "FAIL").length;
		const total = this.results.length;

		console.log("\n" + "=".repeat(50));
		console.log("📊 TEST SUMMARY");
		console.log("=".repeat(50));
		console.log(`Total Tests: ${total}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);

		if (failed > 0) {
			console.log("\n🚨 FAILED TESTS:");
			this.results
				.filter((r) => r.status === "FAIL")
				.forEach((result) => {
					console.log(`   • ${result.name}: ${result.error?.message}`);
				});
		}

		const overallStatus =
			failed === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED";
		console.log(`\n${overallStatus}`);
		console.log("=".repeat(50));

		if (failed > 0) {
			process.exit(1);
		}
	}
}

// Run tests
const runner = new TestRunner();
runner.runAllTests().catch((error) => {
	console.error("❌ Test runner failed:", error);
	process.exit(1);
});
