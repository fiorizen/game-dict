import * as fs from "node:fs";
import * as path from "node:path";
import { Database } from "../../database/index.js";
import { CSVHandlers } from "../../main/csv-handlers.js";
import type { Category, Entry, Game } from "../../shared/types.js";

/**
 * テスト用データベースヘルパー
 * 共通のセットアップ・ティアダウン・テストデータ作成機能を提供
 */
export class TestDatabaseHelper {
	private static instance: TestDatabaseHelper;
	private db: Database;
	private csvHandlers: CSVHandlers;

	constructor() {
		this.db = Database.getInstance();
		this.csvHandlers = new CSVHandlers();
	}

	static getInstance(): TestDatabaseHelper {
		if (!TestDatabaseHelper.instance) {
			TestDatabaseHelper.instance = new TestDatabaseHelper();
		}
		return TestDatabaseHelper.instance;
	}

	/**
	 * テスト環境のクリーンアップ
	 */
	static cleanupTestData(): void {
		const testDataPath = path.join(process.cwd(), "test-data");
		if (fs.existsSync(testDataPath)) {
			fs.rmSync(testDataPath, { recursive: true, force: true });
		}
	}

	/**
	 * ユニークなテストゲームを作成
	 */
	createUniqueGame(name?: string): Game {
		// 16文字制限に対応するため、短いユニークIDを生成
		const uniqueId =
			Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5);
		const gameData = {
			name: name ? `${name} ${uniqueId}` : `Test Game ${uniqueId}`,
			code: `test${uniqueId}`, // test + 9文字 = 13文字 (16文字以内)
		};
		return this.db.games.create(gameData);
	}

	/**
	 * テスト用カテゴリを取得（デフォルトカテゴリ使用）
	 */
	getDefaultCategories(): Category[] {
		return this.db.categories.getAll();
	}

	/**
	 * テスト用エントリーを作成
	 */
	createTestEntry(gameId: number, options: Partial<Entry> = {}): Entry {
		const uniqueId = Date.now().toString().slice(-6);
		const defaultCategories = this.getDefaultCategories();

		const entryData = {
			game_id: gameId,
			category_id: options.category_id || defaultCategories[0].id,
			reading: options.reading || `てすと${uniqueId}`,
			word: options.word || `テスト${uniqueId}`,
			description: options.description || `テスト用エントリー${uniqueId}`,
		};

		return this.db.entries.create(entryData);
	}

	/**
	 * 複数のテストエントリーを作成
	 */
	createMultipleTestEntries(gameId: number, count: number): Entry[] {
		const entries: Entry[] = [];
		for (let i = 0; i < count; i++) {
			entries.push(
				this.createTestEntry(gameId, {
					reading: `てすと${i}`,
					word: `テスト${i}`,
					description: `テスト用エントリー${i}`,
				}),
			);
		}
		return entries;
	}

	/**
	 * エクスポートディレクトリのクリーンアップ
	 */
	cleanupExportDir(): void {
		const exportDir = path.join(process.cwd(), "export");
		if (fs.existsSync(exportDir)) {
			fs.rmSync(exportDir, { recursive: true, force: true });
		}
	}

	/**
	 * データベースインスタンスを取得
	 */
	getDatabase(): Database {
		return this.db;
	}

	/**
	 * CSVハンドラーを取得
	 */
	getCSVHandlers(): CSVHandlers {
		return this.csvHandlers;
	}

	/**
	 * テストデータの完全リセット
	 */
	reset(): void {
		// データベースの完全リセット
		Database.resetInstance();
		this.db = Database.getInstance();
		this.csvHandlers = new CSVHandlers();
	}
}
