import fs from "node:fs";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { DataSyncManager } from "../main/data-sync-manager.js";
import { Database } from "../database/index.js";

// Setup test environment
const testDataPath = path.join(process.cwd(), "test-data");
const testCsvPath = path.join(testDataPath, "csv");

beforeEach(() => {
	// Clean test CSV data before each test
	if (fs.existsSync(testCsvPath)) {
		fs.rmSync(testCsvPath, { recursive: true, force: true });
	}
	
	// Clean database data (games and entries, but keep categories)
	const db = Database.getInstance();
	const entries = db.entries.getAll();
	const games = db.games.getAll();
	
	entries.forEach(entry => db.entries.delete(entry.id));
	games.forEach(game => db.games.delete(game.id));
});

afterEach(() => {
	// Clean test CSV data after each test
	if (fs.existsSync(testCsvPath)) {
		fs.rmSync(testCsvPath, { recursive: true, force: true });
	}
});

describe("Data Sync Manager Tests", () => {
	it("should create data sync manager instance", () => {
		const dataSyncManager = new DataSyncManager(testCsvPath);
		const db = Database.getInstance();
		expect(dataSyncManager).toBeDefined();
		expect(db).toBeDefined();
	});

	it("should analyze data status when no CSV exists", () => {
		const dataSyncManager = new DataSyncManager(testCsvPath);
		const status = dataSyncManager.analyzeDataStatus();
		
		expect(status.csvDirExists).toBe(false);
		expect(status.csvFilesExist).toBe(false);
		expect(status.csvGameCount).toBe(0);
		expect(status.csvEntryCount).toBe(0);
		expect(status.dbGameCount).toBeGreaterThanOrEqual(0);
		expect(status.dbEntryCount).toBeGreaterThanOrEqual(0);
		expect(status.recommendation).toBe('skip_import');
	});

	it("should handle safe auto import when CSV exists and DB is empty", async () => {
		// Create test CSV directory and files
		if (!fs.existsSync(testCsvPath)) {
			fs.mkdirSync(testCsvPath, { recursive: true });
		}

		// Create test games.csv
		const gamesContent = `id,name,created_at,updated_at
1,Test Game,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z`;
		fs.writeFileSync(path.join(testCsvPath, "games.csv"), gamesContent);

		// Create test categories.csv
		const categoriesContent = `id,name,google_ime_name,ms_ime_name,atok_name
1,名詞,一般,一般,一般
2,人名,人名,人名,人名`;
		fs.writeFileSync(path.join(testCsvPath, "categories.csv"), categoriesContent);

		// Create test game-1.csv
		const gameEntriesContent = `# Game: Test Game (ID: 1)
category_name,reading,word,description
名詞,てすと,テスト,テスト用エントリ
人名,たろう,太郎,テスト人名`;
		fs.writeFileSync(path.join(testCsvPath, "game-1.csv"), gameEntriesContent);

		// Create test sync manager with explicit CSV directory
		const testSyncManager = new DataSyncManager(testCsvPath);

		const status = testSyncManager.analyzeDataStatus();
		
		expect(status.csvDirExists).toBe(true);
		expect(status.csvFilesExist).toBe(true);
		expect(status.csvGameCount).toBe(1);
		expect(status.csvEntryCount).toBe(2);
		expect(status.recommendation).toBe('auto_import');
	});

	it("should detect conflict when DB has more data than CSV", () => {
		// Create minimal CSV data first
		if (!fs.existsSync(testCsvPath)) {
			fs.mkdirSync(testCsvPath, { recursive: true });
		}

		// Create test games.csv with one game
		const gamesContent = `id,name,created_at,updated_at
1,CSV Game,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z`;
		fs.writeFileSync(path.join(testCsvPath, "games.csv"), gamesContent);

		// Create test game-1.csv with one entry
		const gameEntriesContent = `# Game: CSV Game (ID: 1)
category_name,reading,word,description
名詞,しーえすぶい,CSV,CSV用エントリ`;
		fs.writeFileSync(path.join(testCsvPath, "game-1.csv"), gameEntriesContent);

		const db = Database.getInstance();
		
		// Add more data to DB than CSV has
		const testGame1 = db.games.create({ name: "DB Test Game 1" });
		const testGame2 = db.games.create({ name: "DB Test Game 2" });
		const categories = db.categories.getAll();
		
		db.entries.create({
			game_id: testGame1.id,
			category_id: categories[0].id,
			reading: "でーたべーす",
			word: "データベース",
			description: "DB専用エントリ1"
		});
		
		db.entries.create({
			game_id: testGame2.id,
			category_id: categories[0].id,
			reading: "でーたべーす2",
			word: "データベース2",
			description: "DB専用エントリ2"
		});

		const testSyncManager = new DataSyncManager(testCsvPath);
		const status = testSyncManager.analyzeDataStatus();
		
		expect(status.hasConflict).toBe(true);
		expect(status.conflictType).toBe('db_has_more_data');
		expect(status.recommendation).toBe('user_confirm');
	});

	it("should generate appropriate conflict messages", () => {
		const testSyncManager = new DataSyncManager(testCsvPath);

		const status = testSyncManager.analyzeDataStatus();
		
		if (status.hasConflict) {
			const conflictMessage = testSyncManager.getConflictMessage(status);
			
			expect(conflictMessage.title).toBeDefined();
			expect(conflictMessage.message).toBeDefined();
			expect(conflictMessage.options).toBeDefined();
			expect(conflictMessage.options.length).toBeGreaterThan(0);
			
			// Check option structure
			conflictMessage.options.forEach(option => {
				expect(option.label).toBeDefined();
				expect(option.action).toBeDefined();
				expect(option.description).toBeDefined();
				expect(['import_csv', 'keep_db', 'backup_and_import']).toContain(option.action);
			});
		}
	});

	it("should perform user choice actions", async () => {
		const testSyncManager = new DataSyncManager(testCsvPath);

		// Test 'keep_db' action
		const keepDbResult = await testSyncManager.performUserChoice({
			action: 'keep_db',
			confirmed: true
		});
		expect(keepDbResult.success).toBe(true);

		// Test unconfirmed action
		const unconfirmedResult = await testSyncManager.performUserChoice({
			action: 'import_csv',
			confirmed: false
		});
		expect(unconfirmedResult.success).toBe(false);
		expect(unconfirmedResult.error).toContain('cancelled');
	});

	it("should handle CSV counting correctly", () => {
		// Create test CSV files for this specific test
		if (!fs.existsSync(testCsvPath)) {
			fs.mkdirSync(testCsvPath, { recursive: true });
		}

		// Create test games.csv
		const gamesContent = `id,name,created_at,updated_at
1,Test Game,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z`;
		fs.writeFileSync(path.join(testCsvPath, "games.csv"), gamesContent);

		// Create test game-1.csv
		const gameEntriesContent = `# Game: Test Game (ID: 1)
category_name,reading,word,description
名詞,てすと,テスト,テスト用エントリ
人名,たろう,太郎,テスト人名`;
		fs.writeFileSync(path.join(testCsvPath, "game-1.csv"), gameEntriesContent);
		
		const testSyncManager = new (class extends DataSyncManager {
			constructor() {
				super(testCsvPath);
			}
			// Expose private methods for testing
			public testCountCsvGames() {
				return (this as any).countCsvGames();
			}
			public testCountCsvEntries() {
				return (this as any).countCsvEntries();
			}
		})();

		const gameCount = testSyncManager.testCountCsvGames();
		const entryCount = testSyncManager.testCountCsvEntries();

		expect(gameCount).toBe(1);
		expect(entryCount).toBe(2); // てすと and たろう entries
	});

	it("should analyze exit status with no changes", () => {
		const testSyncManager = new DataSyncManager(testCsvPath);
		const exitStatus = testSyncManager.analyzeExitStatus();
		
		expect(exitStatus.hasChanges).toBe(false);
		expect(exitStatus.recommendation).toBe('skip_export');
		expect(exitStatus.dbGameCount).toBeGreaterThanOrEqual(0);
		expect(exitStatus.dbEntryCount).toBeGreaterThanOrEqual(0);
	});

	it("should analyze exit status with changes", () => {
		const testSyncManager = new DataSyncManager(testCsvPath);
		const db = Database.getInstance();
		
		// Add data to trigger changes
		const testGame = db.games.create({ name: "Exit Test Game" });
		const categories = db.categories.getAll();
		
		db.entries.create({
			game_id: testGame.id,
			category_id: categories[0].id,
			reading: "しゅうりょう",
			word: "終了",
			description: "終了テスト"
		});

		const exitStatus = testSyncManager.analyzeExitStatus();
		
		expect(exitStatus.hasChanges).toBe(true);
		expect(exitStatus.recommendation).toBe('user_confirm');
		expect(exitStatus.dbGameCount).toBeGreaterThan(0);
		expect(exitStatus.dbEntryCount).toBeGreaterThan(0);
	});

	it("should perform exit choice actions", async () => {
		const testSyncManager = new DataSyncManager(testCsvPath);

		// Test 'skip_export' action
		const skipResult = await testSyncManager.performExitChoice({
			action: 'skip_export',
			confirmed: true
		});
		expect(skipResult.success).toBe(true);

		// Test unconfirmed action
		const unconfirmedResult = await testSyncManager.performExitChoice({
			action: 'export_csv',
			confirmed: false
		});
		expect(unconfirmedResult.success).toBe(false);
		expect(unconfirmedResult.error).toContain('cancelled');
	});

	it("should perform auto export", async () => {
		const testSyncManager = new DataSyncManager(testCsvPath);
		const db = Database.getInstance();
		
		// Add some data to export
		const testGame = db.games.create({ name: "Auto Export Game" });
		const categories = db.categories.getAll();
		
		db.entries.create({
			game_id: testGame.id,
			category_id: categories[0].id,
			reading: "じどう",
			word: "自動",
			description: "自動エクスポートテスト"
		});

		const result = await testSyncManager.performAutoExport();
		expect(result.success).toBe(true);
	});

	it("should generate exit messages", () => {
		const testSyncManager = new DataSyncManager(testCsvPath);
		
		// Test message for changes
		const changesStatus = {
			hasChanges: true,
			lastExportTime: null,
			dbGameCount: 2,
			dbEntryCount: 5,
			csvGameCount: 1,
			csvEntryCount: 3,
			recommendation: 'user_confirm' as const
		};

		const changesMessage = testSyncManager.getExitMessage(changesStatus);
		expect(changesMessage.title).toContain('変更が検出されました');
		expect(changesMessage.options.length).toBe(2);
		expect(changesMessage.options[0].action).toBe('export_csv');
		expect(changesMessage.options[1].action).toBe('skip_export');

		// Test message for auto export
		const autoExportStatus = {
			hasChanges: false,
			lastExportTime: null,
			dbGameCount: 1,
			dbEntryCount: 3,
			csvGameCount: 0,
			csvEntryCount: 0,
			recommendation: 'auto_export' as const
		};

		const autoExportMessage = testSyncManager.getExitMessage(autoExportStatus);
		expect(autoExportMessage.title).toContain('バックアップ');
		expect(autoExportMessage.options.length).toBe(2);
	});
});