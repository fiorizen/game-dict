# Database Testing Guide

## 概要

このドキュメントでは、SQLite実装のテスト方法について説明します。

## テスト環境のセットアップ

### 前提条件

```bash
npm install
npm run build
```

### テストファイルの実行

プロジェクトには3つのテスト方法があります：

```bash
# 1. 新しい構造化テストランナー（推奨）
npm run test:db:runner

# 2. 詳細テスト（デバッグ用）
npm run test:db:detailed

# 3. 基本テスト（シンプル）
npm run test:db
```

**推奨**: `npm run test:db:runner` - 明確なPass/Fail判定とサマリーを表示

## テスト内容

### 1. ゲーム作成テスト

```typescript
const game = db.games.create({ name: "Final Fantasy XIV" });
```

- 新しいゲームの作成
- 自動的なタイムスタンプ設定の確認
- 重複チェック（UNIQUE制約）

### 2. カテゴリ一覧テスト

```typescript
const categories = db.categories.getAll();
```

- デフォルトカテゴリの自動作成確認
- カテゴリ構造の検証
- IME形式別名称の確認

### 3. エントリ作成テスト

```typescript
const entry = db.entries.create({
  game_id: game.id,
  category_id: categories[0].id,
  reading: "バハムート",
  word: "バハムート",
  description: "召喚獣の王、最強クラスの召喚獣",
});
```

- エントリの作成
- 外部キー制約の確認
- オプションフィールド（description）の処理

### 4. 検索機能テスト

```typescript
const searchResults = db.entries.search("バハ");
```

- 部分一致検索の動作確認
- JOIN結果の検証
- 検索パフォーマンス

## 期待される結果

### 成功時の出力例

```
🧪 Starting SQLite Database Tests

✅ PASS: Database Connection (2ms)
✅ PASS: Game Creation (5ms)
✅ PASS: Duplicate Game Prevention (3ms)
✅ PASS: Game Update (4ms)
✅ PASS: Default Categories (1ms)
✅ PASS: Custom Category Creation (3ms)
✅ PASS: Entry Creation (4ms)
✅ PASS: Entry Search (2ms)
✅ PASS: Foreign Key Constraint (1ms)
✅ PASS: Performance: Bulk Insert (156ms)
✅ PASS: Performance: Search (1ms)

==================================================
📊 TEST SUMMARY
==================================================
Total Tests: 11
✅ Passed: 11
❌ Failed: 0

✅ ALL TESTS PASSED
==================================================
```

### 失敗時の出力例

```
🧪 Starting SQLite Database Tests

✅ PASS: Database Connection (2ms)
❌ FAIL: Game Creation (3ms)
   Error: Assertion failed: Game should have valid ID

==================================================
📊 TEST SUMMARY
==================================================
Total Tests: 11
✅ Passed: 10
❌ Failed: 1

🚨 FAILED TESTS:
   • Game Creation: Assertion failed: Game should have valid ID

❌ SOME TESTS FAILED
==================================================
```

## データベース構造の確認

### テーブル構造

```sql
-- gamesテーブル
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- categoriesテーブル
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    google_ime_name TEXT,
    ms_ime_name TEXT,
    atok_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- entriesテーブル
CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    reading TEXT NOT NULL,
    word TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
```

### インデックス

- `idx_entries_game_id`: ゲーム別検索の高速化
- `idx_entries_category_id`: カテゴリ別検索の高速化
- `idx_entries_reading`: 読み仮名検索の高速化

## 手動テスト

### SQLiteコマンドラインでの確認

```bash
# データベースファイルに接続
sqlite3 ./test-data/game-dict.db

# テーブル一覧
.tables

# スキーマ確認
.schema games
.schema categories
.schema entries

# データ確認
SELECT * FROM games;
SELECT * FROM categories;
SELECT * FROM entries;

# JOIN結果確認
SELECT e.*, g.name as game_name, c.name as category_name
FROM entries e
JOIN games g ON e.game_id = g.id
JOIN categories c ON e.category_id = c.id;
```

## トラブルシューティング

### よくあるエラー

1. **Module not found**: TypeScriptファイルが見つからない

   - `npm run build` を実行してから再試行

2. **Database locked**: データベースファイルがロックされている

   - プロセスを終了してから再実行

3. **FOREIGN KEY constraint failed**: 外部キー制約違反
   - 参照先のレコードが存在するか確認

### クリーンアップ

テストデータは自動的にクリーンアップされますが、手動でクリーンアップする場合：

```bash
# テストデータのクリーンアップ
npm run test:clean

# または手動削除
rm -rf ./test-data
```

**注意**: 全てのテストコマンドは実行前に自動的に `test-data/` ディレクトリをクリーンアップします。

## 次のステップ

- Electron統合後は `app.getPath()` が正常に動作
- テストファイルは開発完了後に削除予定
- 本格的なテストフレームワーク（Vitest等）への移行を検討
