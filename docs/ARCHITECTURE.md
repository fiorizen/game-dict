# 技術アーキテクチャ

## 技術スタック・開発環境

- 言語: **TypeScript**
- ランタイム・UI: **Node.js + Electron**
- DB: **SQLite**
- CSV処理: csv-parse / csv-stringifyなど

## 最新の技術決定事項

- **データ管理思想**: CSV=権威あるデータ、SQLite=一時作業DB
- **ディレクトリ構造**: `csv/` (本番)、`test-data/csv/` (テスト)
- **CSV構成**: games.csv + categories.csv + game-{ID}.csv (完全永続化)
- **データベース**: DrizzleORM + better-sqlite3 (型安全・同期API・高速)
- **ORM**: DrizzleORM (型安全クエリビルダー・後方互換性維持)
- **テストフレームワーク**: Vitest + Vite (業界標準、高速・高機能)
- **UIフレームワーク**: Electron v36.5.0 + TypeScript
- **CSV処理**: csv-parse/csv-stringify (業界標準ライブラリ)
- **型定義**: 完全なTypeScript型安全性
- **ネイティブモジュール管理**: 自動リビルドシステム（詳細は下記参照）
- **スキーマ**: games(id,name) / categories(id,name,ime_names) / entries(id,game_id,category_id,reading,word,description)
- **品質管理**: Biome (Lint・Format) + Prettier (Markdown等)
- **IPC通信**: contextBridge + ipcRenderer/ipcMain (セキュア設計)
- **E2Eテスト**: Playwright + Electron テスト環境 (18テスト・100%成功)
- **UI要件**: エラー時モーダル・サクセス時トースト通知
- **パッケージング**: electron-builder (クロスプラットフォーム対応)

## プロジェクト構造

```
プロジェクトルート/
├── csv/                    # 権威あるデータ（Git管理対象）
│   ├── games.csv           # ゲーム一覧
│   ├── categories.csv      # カテゴリ一覧（IME対応名含む）
│   └── game-{ID}.csv       # ゲーム別単語データ
├── src/
│   ├── main/              # Electronメインプロセス
│   │   ├── main.ts        # アプリケーション起動・ウィンドウ管理
│   │   ├── ipc-handlers.ts # IPC通信ハンドラー（SQLite操作API）
│   │   └── csv-handlers.ts # CSV入出力機能
│   ├── preload/           # セキュアなAPI公開
│   │   └── preload.ts     # contextBridge経由でレンダラーにAPI提供
│   ├── renderer/          # フロントエンド UI
│   │   ├── index.html     # メインUI
│   │   ├── styles/        # CSS スタイル
│   │   └── scripts/       # フロントエンドロジック
│   ├── database/          # DrizzleORM + SQLite関連（一時作業用）
│   │   ├── drizzle-connection.ts  # DrizzleORM接続管理
│   │   ├── drizzle-database.ts    # DrizzleORM統合データベース
│   │   ├── drizzle-wrapper.ts     # 後方互換性ラッパー
│   │   ├── schema.ts      # DrizzleORMスキーマ定義
│   │   ├── adapters.ts    # 型変換アダプター
│   │   ├── models/        # DrizzleORM + 既存CRUD操作モデル
│   │   └── index.ts       # エクスポート（DrizzleWrapper統合）
│   ├── shared/            # 共通型定義
│   │   ├── types.ts       # TypeScript型定義
│   │   └── electron-api.d.ts # Electron API型定義
│   └── __tests__/         # テストコード
│       ├── database.test.ts      # 既存SQLite機能テスト (18テスト)
│       ├── drizzle-database.test.ts # DrizzleORM機能テスト (4テスト)
│       ├── ime-export.test.ts    # IME辞書出力機能テスト (4テスト)
│       └── data-sync.test.ts     # データ同期機能テスト
├── tests/e2e/            # E2Eテスト
│   ├── app.spec.ts       # アプリ基本機能テスト
│   ├── core-functionality.spec.ts # API機能テスト
│   ├── game-add-working.spec.ts # ゲーム追加テスト
│   ├── ime-export.spec.ts # IME出力E2Eテスト (5テスト)
│   ├── simple-test.spec.ts # 単純動作テスト
│   └── ui-functions.spec.ts # UI機能テスト
├── export/               # IME辞書出力先
│   └── {game_code}.txt   # Microsoft IME形式辞書ファイル
└── test-data/
    ├── csv/               # テスト用CSV出力先
    └── game-dict-test.db  # テスト用SQLite（Git無視）
```

## データベース

- **場所**: `~/Library/Application Support/game-dict/game-dict.db` (本番)
- **テスト**: `./test-data/game-dict.db` (テスト時)
- **スキーマ**: games, categories, entries の3テーブル
- **デフォルトカテゴリ**: 名詞、品詞なし、人名（名詞を初期選択）

## 🔧 **ネイティブモジュール管理（重要）**

### Biome実行権限問題の自動化対応

**問題**: `@biomejs/cli-darwin-arm64/biome`などのプラットフォーム固有バイナリの実行権限が何らかのタイミングで失われ、以下のエラーが発生する：

```
Error: spawnSync /path/to/node_modules/@biomejs/cli-darwin-arm64/biome EACCES
```

**解決策**: 自動化された権限修正システムを実装：

```bash
# 自動実行（インストール時）
npm install  # postinstall hook で自動実行

# 手動実行（問題発生時）
npm run fix:biome-permissions

# 直接実行
chmod +x node_modules/@biomejs/cli-*/biome
```

**技術実装**:
- `postinstall`スクリプトでBiome権限を自動修正
- ワイルドカード対応により全プラットフォーム対応
- エラー発生時の手動修正コマンド提供

### better-sqlite3 リビルド自動化システム

このプロジェクトでは **better-sqlite3** ネイティブモジュールを使用しており、実行環境に応じて **2つの異なるリビルド** が必要です。

#### 🎯 **リビルドが必要な理由**

better-sqlite3は **ネイティブモジュール** (C++コンパイル済みバイナリ) のため、実行環境のNode.jsバージョンに一致する必要があります：

- **システムNode.js**: v22.16.0 (NODE_MODULE_VERSION 127)
- **ElectronのNode.js**: v36.5.0内蔵版 (NODE_MODULE_VERSION 135)

#### 🔄 **2つのリビルドパターン**

| 用途 | コマンド | 実行タイミング | 対象環境 |
|------|----------|----------------|----------|
| **Electron用** | `npm run rebuild:electron` | アプリ実行・E2Eテスト | Electron内蔵Node.js |
| **Node.js用** | `npm run rebuild:node` | Vitestテスト | システムNode.js |

#### 🤖 **自動化された実行フロー**

```bash
# Electron系（自動実行）
npm run postinstall        # インストール後 → Electron用リビルド
npm start                   # 本番実行 → Electron用（postinstallで済み）
npm run electron:dev        # 開発実行 → Electron用（postinstallで済み）
npm run test:e2e           # E2Eテスト → rebuild:electron実行

# Vitest系（自動実行）
npm test                   # rebuild:node → vitest run
npm run test:watch         # rebuild:node → vitest watch
npm run test:ui            # rebuild:node → vitest --ui  
npm run test:coverage      # rebuild:node → vitest coverage
```

#### ⚠️ **過去の問題と解決策**

**問題**: 
```
The module 'better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION XXX. This version requires NODE_MODULE_VERSION YYY.
```

**解決策**: 
- ✅ **自動化済み**: 各npm scriptが適切なリビルドを自動実行
- ✅ **手動実行**: 問題発生時は該当するrebuildスクリプトを実行

#### 🧪 **開発時の注意点**

1. **新しいマシンでのセットアップ**: `npm install` → 自動的にElectron用リビルド
2. **テスト実行**: `npm test` → 自動的にNode.js用リビルド  
3. **Electronアプリ実行**: 追加作業不要（postinstallで完了）
4. **Node.jsバージョン変更後**: 該当するrebuildスクリプトを手動実行

#### 📋 **手動リビルドが必要なケース**

稀にエラーが発生した場合の手動対処法：

```bash
# Electronアプリでエラーが出る場合
npm run rebuild:electron

# Vitestテストでエラーが出る場合  
npm run rebuild:node

# 完全クリーンリビルド
rm -rf node_modules
npm install  # postinstallでElectron用リビルド実行
```

#### ✅ プリビルドバイナリ導入済み

**✅ プリビルドバイナリ導入済み** - 以下の仕組みで最適化されています：
- `npm install` → **prebuild-install** によるプリコンパイル済みバイナリの自動取得
- プリビルドが無い場合のみリビルド実行（フォールバック）
- テスト・E2E実行時の自動リビルド継続

**自動化されたコマンド**:
- `npm test` (Node.js用リビルド付き)
- `npm run test:e2e` (Electron用リビルド付き)
- `npm install` (prebuild-install → 必要時のみElectron用リビルド)

**手動リビルドが必要な場合**:
```bash
# Electronアプリでエラーが出る場合
npm run rebuild:electron

# Vitestテストでエラーが出る場合
npm run rebuild:node

# 注意: プリビルド導入により手動実行の頻度は大幅削減
```

## 🎯 データ管理思想（設計原則）

### 権威あるデータの考え方

**CSV が「正」のデータ、SQLite は一時的な作業用データベース**

```
CSV (csv/) ← 権威あるデータソース（Git管理対象）
    ↓ 読込
SQLite ← 一時的な高速作業用DB（Git無視）
    ↓ 確定時
CSV (csv/) ← 更新・永続化
```

### データフローと責任分担

| データストア | 役割           | Git管理     | 説明                             |
| ------------ | -------------- | ----------- | -------------------------------- |
| **CSV**      | **権威データ** | ✅ 管理対象 | 永続化・差分管理・バックアップ   |
| **SQLite**   | **作業DB**     | ❌ 無視     | 高速CRUD・検索・一時的な作業領域 |

### 実現されたメリット

1. **Git差分管理**: CSVによる明確な変更履歴
2. **データ可視性**: テキストファイルで直接確認可能
3. **バックアップ性**: Gitによる自動履歴保存
4. **作業効率**: SQLiteによる高速なリアルタイム編集
5. **データ復旧**: CSVから完全復元可能

### ディレクトリ構成

```
プロジェクトルート/
├── csv/                    # 🎯 権威あるデータ（本番）
│   ├── games.csv           # ゲーム情報
│   ├── categories.csv      # カテゴリ情報
│   └── game-{ID}.csv       # ゲーム別単語データ
└── test-data/
    ├── csv/               # 🧪 テスト用CSV出力先
    └── game-dict-test.db  # 🧪 テスト用SQLite（無視）
```

この設計思想により、**データの永続性**と**作業効率**を両立した堅牢なデータ管理システムを実現しています。