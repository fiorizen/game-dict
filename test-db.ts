// Temporary test file for SQLite implementation
// This file will be removed once Electron integration is complete

import fs from "node:fs";
import path from "node:path";
import { Database } from "./src/database/index.js";

// Clean test data before starting
const testDataPath = path.join(process.cwd(), "test-data");
if (fs.existsSync(testDataPath)) {
	fs.rmSync(testDataPath, { recursive: true, force: true });
}

console.log("Testing SQLite implementation...");

try {
	// Mock Electron app.getPath for testing
	const mockApp = {
		getPath: (_name: string) => "./test-data",
	};
	global.app = mockApp;

	const db = Database.getInstance();

	// Test game creation
	console.log("Creating test game...");
	const game = db.games.create({ name: "Final Fantasy XIV" });
	console.log("Created game:", game);

	// Test category listing
	console.log("Listing categories...");
	const categories = db.categories.getAll();
	console.log("Categories:", categories);

	// Test entry creation
	console.log("Creating test entry...");
	const entry = db.entries.create({
		game_id: game.id,
		category_id: categories[0].id,
		reading: "バハムート",
		word: "バハムート",
		description: "召喚獣の王、最強クラスの召喚獣",
	});
	console.log("Created entry:", entry);

	// Test search
	console.log("Searching entries...");
	const searchResults = db.entries.search("バハ");
	console.log("Search results:", searchResults);

	console.log("SQLite implementation test completed successfully!");

	db.close();
} catch (error) {
	console.error("Test failed:", error);
}
