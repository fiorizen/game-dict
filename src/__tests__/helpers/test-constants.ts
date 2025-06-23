/**
 * テスト用定数定義
 * 共通のテストデータ、タイムアウト値、パターンを定義
 */

/**
 * テスト用タイムアウト定数
 */
export const TEST_TIMEOUTS = {
	SHORT: 500,
	MEDIUM: 1000,
	LONG: 2000,
	DATABASE_OPERATION: 1000,
	FILE_OPERATION: 1500,
} as const;

/**
 * テスト用サンプルデータ
 */
export const TEST_DATA = {
	SAMPLE_GAMES: [
		{ name: "テストゲーム1", code: "testgame1" },
		{ name: "テストゲーム2", code: "testgame2" },
		{ name: "Sample Game", code: "samplegame" },
	],

	SAMPLE_ENTRIES: [
		{ reading: "てすと", word: "テスト", description: "テスト用単語" },
		{ reading: "げーむ", word: "ゲーム", description: "娯楽用ゲーム" },
		{ reading: "たんご", word: "単語", description: "言葉の単位" },
		{ reading: "じしょ", word: "辞書", description: "単語を調べる本" },
		{ reading: "にほんご", word: "日本語", description: "日本の言語" },
	],

	CATEGORIES: {
		NOUN: "名詞",
		PERSON: "人名",
		NONE: "品詞なし",
	},

	INVALID_DATA: {
		EMPTY_READING: { reading: "", word: "テスト", description: "無効" },
		EMPTY_WORD: { reading: "てすと", word: "", description: "無効" },
		INVALID_GAME_CODE: { name: "Invalid Game", code: "invalid-code!" },
		LONG_GAME_CODE: {
			name: "Long Code Game",
			code: "verylonggamecodeexceeding16chars",
		},
	},
} as const;

/**
 * テスト用ファイルパス
 */
export const TEST_PATHS = {
	TEST_DATA_DIR: "test-data",
	CSV_DIR: "test-data/csv",
	EXPORT_DIR: "export",
	IMPORT_DIR: "test-data/import",
} as const;

/**
 * IME辞書テスト用データ
 */
export const IME_TEST_DATA = {
	VALID_LINES: [
		"てすと\tテスト\t名詞",
		"げーむ\tゲーム\t名詞",
		"たろう\t太郎\t人名",
	],

	INVALID_LINES: [
		"てすと\tテスト", // カテゴリなし
		"てすと", // 単語なし
		"\t\t", // 全て空
		"てすと\t\t名詞", // 単語が空
	],

	MICROSOFT_IME_FORMAT: {
		DELIMITER: "\t",
		ENCODING: "utf-8",
		EXTENSION: ".txt",
	},
} as const;

/**
 * エラーメッセージパターン
 */
export const ERROR_PATTERNS = {
	DUPLICATE_GAME_NAME: /already exists/i,
	DUPLICATE_GAME_CODE: /already exists/i,
	INVALID_GAME_CODE: /Invalid game code/i,
	REQUIRED_FIELD: /required/i,
	FILE_NOT_FOUND: /not found/i,
	NO_ENTRIES: /No entries found/i,
} as const;
