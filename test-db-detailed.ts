// Detailed test for SQLite implementation

import fs from "node:fs";
import path from "node:path";
import { Database } from "./src/database/index.js";

// Clean test data before starting
const testDataPath = path.join(process.cwd(), "test-data");
if (fs.existsSync(testDataPath)) {
	fs.rmSync(testDataPath, { recursive: true, force: true });
}

async function runDetailedTests() {
	console.log("=== Detailed SQLite Testing ===\n");

	const db = Database.getInstance();

	try {
		// Test 1: Game CRUD operations
		console.log("1. Testing Game CRUD operations...");
		const game1 = db.games.create({ name: "Final Fantasy XIV" });
		const game2 = db.games.create({ name: "Pokémon Scarlet" });
		console.log("✓ Created games:", game1.name, game2.name);

		const allGames = db.games.getAll();
		console.log("✓ Total games:", allGames.length);

		const updatedGame = db.games.update(game1.id, { name: "FF XIV Online" });
		console.log("✓ Updated game:", updatedGame?.name);

		// Test 2: Category operations
		console.log("\n2. Testing Category operations...");
		const categories = db.categories.getAll();
		console.log("✓ Default categories loaded:", categories.length);

		const customCategory = db.categories.create({
			name: "カスタムカテゴリ",
			google_ime_name: "一般",
			ms_ime_name: "一般",
			atok_name: "一般",
		});
		console.log("✓ Created custom category:", customCategory.name);

		// Test 3: Entry CRUD operations
		console.log("\n3. Testing Entry CRUD operations...");
		const entries = [
			{
				game_id: game1.id,
				category_id: categories[0].id,
				reading: "バハムート",
				word: "バハムート",
				description: "召喚獣の王",
			},
			{
				game_id: game1.id,
				category_id: categories[1].id,
				reading: "ミドガルド",
				word: "ミドガルド",
				description: "巨大都市",
			},
			{
				game_id: game2.id,
				category_id: categories[0].id,
				reading: "ピカチュウ",
				word: "ピカチュウ",
				description: "電気ポケモン",
			},
		];

		const createdEntries = entries.map((entry) => db.entries.create(entry));
		console.log("✓ Created entries:", createdEntries.length);

		// Test 4: Search functionality
		console.log("\n4. Testing Search functionality...");
		const searchBaha = db.entries.search("バハ");
		console.log("✓ Search 'バハ':", searchBaha.length, "results");

		const searchPokemon = db.entries.search("ピカ");
		console.log("✓ Search 'ピカ':", searchPokemon.length, "results");

		const searchByGame = db.entries.search("", game1.id);
		console.log("✓ Search by game (FF XIV):", searchByGame.length, "results");

		// Test 5: Detailed queries
		console.log("\n5. Testing Detailed queries...");
		const entriesWithDetails = db.entries.getAllWithDetails();
		console.log("✓ All entries with details:", entriesWithDetails.length);

		const gameEntries = db.entries.getByGameIdWithDetails(game1.id);
		console.log("✓ FF XIV entries:", gameEntries.length);

		// Test 6: Update operations
		console.log("\n6. Testing Update operations...");
		const updatedEntry = db.entries.update(createdEntries[0].id, {
			description: "最強の召喚獣",
		});
		console.log("✓ Updated entry description:", updatedEntry?.description);

		// Test 7: Data integrity tests
		console.log("\n7. Testing Data integrity...");

		// Try to create duplicate game (should fail)
		try {
			db.games.create({ name: "FF XIV Online" });
			console.log("✗ Duplicate game creation should have failed");
		} catch (_error) {
			console.log("✓ Duplicate game creation properly rejected");
		}

		// Test foreign key constraints
		try {
			db.entries.create({
				game_id: 9999,
				category_id: categories[0].id,
				reading: "Test",
				word: "Test",
			});
			console.log("✗ Invalid foreign key should have failed");
		} catch (_error) {
			console.log("✓ Foreign key constraint properly enforced");
		}

		// Test 8: Performance test
		console.log("\n8. Testing Performance...");
		const startTime = Date.now();

		for (let i = 0; i < 100; i++) {
			db.entries.create({
				game_id: game1.id,
				category_id: categories[i % categories.length].id,
				reading: `テスト${i}`,
				word: `テスト${i}`,
				description: `パフォーマンステスト用エントリ${i}`,
			});
		}

		const endTime = Date.now();
		console.log(`✓ Created 100 entries in ${endTime - startTime}ms`);

		const searchTime = Date.now();
		const searchResults = db.entries.search("テスト");
		const searchEndTime = Date.now();
		console.log(
			`✓ Searched ${searchResults.length} entries in ${searchEndTime - searchTime}ms`,
		);

		// Test 9: Database statistics
		console.log("\n9. Database Statistics:");
		console.log("  - Games:", db.games.getAll().length);
		console.log("  - Categories:", db.categories.getAll().length);
		console.log("  - Entries:", db.entries.getAll().length);

		console.log("\n=== All tests completed successfully! ===");
	} catch (error) {
		console.error("Test failed:", error);
		throw error;
	} finally {
		db.close();
	}
}

// Run the tests
runDetailedTests().catch(console.error);
