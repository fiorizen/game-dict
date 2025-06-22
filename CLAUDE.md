# IME辞書管理ツール プロジェクト設計書 / タスク指示書

---

## プロジェクト概要

複数のゲーム専門用語辞書をまとめて管理するElectronアプリ。  
**CSV**を権威あるデータソースとし、Git管理による差分管理・永続化を実現。  
**SQLite**は高速な作業用一時データベースとして機能し、アプリ起動時にCSVから自動復元。  
IME辞書登録用CSVも出力可能。

### 🎯 **データ管理思想**

- **CSV（`csv/`）** = 権威あるデータソース（Git管理対象、永続化）
- **SQLite** = 一時的な作業用データベース（Git無視、高速アクセス）
- **データフロー**: CSV → SQLite（起動時読込） → CSV（確定時出力）

---

## 技術スタック・開発環境

- 言語: **TypeScript**
- ランタイム・UI: **Node.js + Electron**
- DB: **SQLite**
- CSV処理: csv-parse / csv-stringifyなど

---

## 開発環境・品質管理ツール選定

- **コードフォーマット・Lint:** Biomeを採用し、非対応ファイル（markdown, html, json）のみPrettierでフォーマット
- **エディタ共通設定:** EditorConfig（一般的なルールで生成）
- **ビルドツール:** プロジェクト構成に適したものをClaude Codeにて選定
- **テストフレームワーク:** プロジェクト構成に適したものをClaude Codeにて選定

---

## ミニマム要件

### データ管理機能

- **アプリ起動時**: CSV（`csv/`）からSQLiteへの自動読込・復元
- **作業中**: SQLite DBによる高速な読み書き・検索
- **確定時**: SQLiteからCSV（`csv/`）への完全出力（games.csv、categories.csv、game-\*.csv）

### UI機能

- ワードの一覧表示・検索
- ワード単位の登録・編集UIと即時DB反映（インライン編集・自動保存）
- CSV確定をトリガーする「Git管理用CSV出力」UI
- 辞書登録用CSVへのフォーマット変換・出力（Google・MS-IME・ATOK対応）

---

## 最終要件（拡張案）

- E2Eテスト・自動化CI導入
- ゲームごとに別の辞書として扱う切り替えUI
- 辞書登録用CSVの対応形式追加

---

## タスク大分類

1. 環境構築・セットアップ
2. 仕様ドキュメントの整備（特にテーブル構成に関わる部分）
3. SQLite DB設計・マイグレーション実装
4. CSV入出力機能（インポート・エクスポート）
5. Electron UI基本画面（一覧、編集、絞り込み）
6. 編集内容の即時SQLite反映処理
7. 確定操作によるCSV更新機能実装
8. 辞書登録用CSVの出力処理
9. Git連携ルール整備（.gitignore設定含む）
10. テストコード整備（単体テスト・E2E）

---

## 開発環境・品質管理タスク（重要）

- Biomeを導入し、.biomerc.json等の設定を行う
- Gitコミット前にBiomeを自動実行する仕組みを実装する
- EditorConfigをプロジェクトルートに配置し、一般的なルールを設定する
- ビルドツールはClaude Codeにて選定し、その導入・設定を行う
- テストフレームワークもClaude Codeにて選定し、テスト環境構築を進める
- VSCodeなど推奨エディタでBiomeプラグイン導入を推奨

---

## 参考技術情報

- Electron: https://www.electronjs.org/
- csv-parse / csv-stringify: https://csv.js.org/parse/
- Biome: https://biomejs.dev/
- EditorConfig: https://editorconfig.org/
- MIT Licenseについて: https://opensource.org/licenses/MIT

---

## 連絡・フィードバック方法

- CLAUDE.mdに記載の指示に沿って出力されたタスク案をレビュー
- 不足・修正点をコメントにて返送
- 会話で決定した内容は随時仕様書やコード内コメント、CLAUDE.mdに反映する（コンテキストに依存しすぎない）

---

## プロジェクト進捗管理

### タスク一覧とステータス

- [x] **プロジェクト構造と現状の確認**

  - [x] プロジェクト初期状態の調査完了
  - [x] package.json、biome.json等の設定確認

- [x] **開発環境・品質管理ツールの設定方針決定**

  - [x] TypeScript + better-sqlite3 + Vitest の技術選定
  - [x] Biome + Prettier の品質管理環境構築

- [x] **SQLiteスキーマ設計**

  - [x] games, categories, entries テーブル設計
  - [x] IME形式別カテゴリ対応設計
  - [x] 外部キー制約とインデックス設計

- [x] **SQLiteの実装（スキーマ・マイグレーション・CRUD）**

  - [x] DatabaseConnectionクラス（シングルトン）
  - [x] GameModel, CategoryModel, EntryModel 実装
  - [x] 包括的テストスイート（12テスト、100% Pass）
  - [x] 自動テストデータクリーンアップ
  - [x] Vitestへの移行（独自テストランナーから業界標準へ）

- [x] **Electronアプリ基本構造設計**

  - [x] メインプロセス・レンダラープロセス設計
  - [x] IPC通信設計とAPI実装
  - [x] ウィンドウ管理とUI基盤
  - [x] Electron依存関係とビルド設定

- [x] **CSV入出力機能の実装**

  - [x] Git管理用CSVのインポート・エクスポート
  - [x] IME辞書用CSV出力（Google・MS-IME・ATOK対応）
  - [x] csv-parse/csv-stringify ライブラリ統合
  - [x] IPC通信とUI統合

- [x] **Electronアプリ起動と動作確認**

  - [x] Electron v36.5.0 への更新
  - [x] better-sqlite3 互換性問題解決
  - [x] アセットビルド・コピー対応
  - [x] IPC通信動作確認

- [x] **初回起動時エラーハンドリング修正**

  - [x] 空データ時のエラーアラート削除
  - [x] 適切な空状態表示
  - [x] ユーザビリティ向上

- [x] **E2Eテスト完全実装・安定化**

  - [x] Playwright E2Eテスト環境構築
  - [x] 全18テスト 100%成功率達成
  - [x] 単語追加機能テスト修正（重複ゲーム名問題解決）
  - [x] モーダル状態管理強化
  - [x] テストデータ分離とクリーンアップ

- [x] **UI要件仕様策定・実装**

  - [x] UI-REQUIREMENTS.md作成
  - [x] エラー時のみモーダル表示仕様
  - [x] サクセス時トースト通知実装
  - [x] ユーザビリティ向上（邪魔にならないUI）

- [x] **インライン編集機能完全実装**

  - [x] カテゴリ選択（絞込）機能の削除
  - [x] カテゴリ仕様更新（6→3カテゴリ、名詞デフォルト）
  - [x] モーダルからインライン編集への完全移行
  - [x] フォーカスアウト時自動保存機能
  - [x] 連続登録ワークフロー実装
  - [x] 重複保存防止機能
  - [x] 常時インライン表示モード
  - [x] 単語モーダル削除・クリーンアップ
  - [x] E2Eテストのインライン編集対応

- [x] **Git管理用CSV出力機能完全実装**

  - [x] CSV出力機能のゲーム別・固定ファイル名対応
  - [x] Git差分管理最適化（game-{ID}.csv形式）
  - [x] UIボタン実装（Git管理用CSV出力）
  - [x] CSV変換ロジック単体テスト（6テスト・100%成功）
  - [x] E2EテストによるUI動作確認（4テスト・100%成功）

- [x] **CSV機能拡張・データ管理思想実現**

  - [x] games.csv出力機能実装（ゲーム情報の完全出力）
  - [x] categories.csv出力機能実装（カテゴリ情報・IME対応名の完全出力）
  - [x] CSV一括取込機能実装（ディレクトリからの完全復元）
  - [x] ディレクトリ名称変更（csv-exports → csv、権威あるデータ思想の実現）
  - [x] 設計思想文書化（CSV=正のデータ、SQLite=一時DB）
  - [x] 18/18テスト成功（新ディレクトリ構造対応）

- [x] **DrizzleORM導入・DB接続最適化**

  - [x] DrizzleORM依存関係インストール（drizzle-orm, drizzle-kit）
  - [x] 完全なスキーマ定義実装（games, categories, entries）
  - [x] DrizzleORM設定とマイグレーション機能実装
  - [x] 既存モデルクラスをDrizzleORM同期APIに移行
  - [x] Database接続クラスをDrizzle対応に更新
  - [x] DrizzleDatabaseWrapper実装（後方互換性維持）
  - [x] 型変換アダプター実装（camelCase ↔ snake_case）
  - [x] DrizzleORM専用テスト実装（4/4テスト成功）
  - [x] 既存データベーステスト互換性確保（18/18テスト成功）
  - [x] E2Eテスト完全安定化（22/22テスト成功）
  - [x] テスト環境用Electron終了処理最適化

- [x] **UI/UX最終調整** (完了)

  - [x] 基本UI動作確認
  - [x] 全機能動作テスト完了
  - [x] インライン編集UI実装完了
  - [x] Git管理用CSV出力ボタン実装
  - [x] csvとDBのデータ連携をよりスムーズにする（起動時に自動で読み込み、終了時には書き出し移行に更新されていればユーザーに確認する）
    - [x] 終了時にElectronアプリが起動したままになるバグの修正
    - [x] csv→DBにデータを読み込んだ後、「ゲーム」が１つ以上あれば先頭の「ゲーム」を選択するようにする
  - [x] 細かいUI/UX調整
    - [x] 追加したワードは最下行に表示する（ソートしない）。次回起動時かゲーム切り替えのタイミングでreadingでソートする。

- [x] **gameにcodeを導入する** (完了)

  - [x] ファイル名やCSV内で使用できるように、アルファベット+数字に限定した、各gameにユニークな文字列。最大16文字まで。登録時に必須指定で、編集UIは一旦不要（今後ゲーム全体の編集UIは実装する可能性あり）
  - [x] ファイル名にgame idを使っている部分にcodeを使うようにする
  - [x] バリデーション機能・重複チェック・自動生成機能完備
  - [x] 全テスト修正・安定化（単体36/36・E2E22/22テスト成功）

- [x] **IME登録用辞書ファイルの出力機能実装** (完了)

  - [x] 現在表示しているgameの単語全件を`export`ディレクトリに出力する
  - [x] Microsoft IME形式：reading、word、category_nameをタブ区切りで並べたUTF-8の.txt。ファイル名はgame codeを使う
  - [x] スマートボタン制御：単語がない場合は出力ボタンを無効化
  - [x] 完全なUI統合とエラーハンドリング
  - [x] 包括的テストカバレッジ（単体4/4・E2E5/5テスト成功）

- [x] **`npm start`の実装** (完了)
  - [x] 日常的に利用する本番DB・CSV接続コマンド実装

- [x] **gameの削除・編集機能・UI実装** (完了)
  - [x] 削除：関連ワード全削除、トランザクション型安全削除、警告UI完備
  - [x] 編集：code・name編集、重複検証、モーダルUI完備
  - [x] E2Eテストによる動作確認完了

- [x] **UI調整** (完了)
  - [x] トースト表示位置を右下に変更（操作ボタンと重複回避）
  - [x] スタッキング機能とスムーズアニメーション追加

- [x] **npm scriptsの整理・ネイティブモジュール管理自動化** (完了)
  - [x] better-sqlite3リビルド自動化システム実装
  - [x] Electron用・Node.js用の2パターン自動切り替え
  - [x] 包括的ドキュメント化により今後の問題を防止
  - [x] rebuild:nodeスクリプトをテストワークフローに統合

### プロジェクト統計

- **完了率**: 18/18 メインタスク (100%) + IME機能実装完了 + npm start実装完了
- **コードテスト**: DrizzleORM 4/4 + 既存DB 18/18 + IME 4/4 + E2E 27/27 = 53/53 Pass (100%成功率)
- **アプリ状態**: **全機能完成・完全統合・安定動作確認済み**
- **技術基盤**: DrizzleORM + SQLite + Vitest + Electron v36 + 完全CSV管理 + インライン編集UI + IME辞書出力 + 安定E2Eテスト
- **データ管理**: CSV（games.csv + categories.csv + game-\*.csv）による完全な永続化実現
- **IME機能**: Microsoft IME辞書出力（.txt形式・タブ区切り・game code命名・スマート制御）
- **ORM統合**: 型安全なDrizzleORM + 後方互換性DrizzleWrapper + テスト環境最適化
- **安定性**: E2Eテスト完全安定化・Electron終了処理問題解決・DB接続簡素化達成
- **本番実行**: npm start による日常利用コマンド実装完了

### 最新の技術決定事項

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

---

## 開発・実行ガイド

### 初回セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScriptビルド
npm run build
```

### 開発コマンド

```bash
# アプリケーション実行（本番利用）
npm start

# 開発用アプリケーション実行
npm run electron:dev

# 開発時のウォッチビルド
npm run dev

# テスト実行
npm test

# データベーステストのみ
npm run test:db

# コード品質チェック
npm run lint
npm run lint:fix
```

### 本番環境と開発環境の違い

| 環境       | データベース                                           | CSVディレクトリ  | コマンド               |
| ---------- | ------------------------------------------------------ | ---------------- | ---------------------- |
| **本番**   | `~/Library/Application Support/game-dict/game-dict.db` | `csv/`           | `npm start`            |
| **開発**   | `~/Library/Application Support/game-dict/game-dict.db` | `csv/`           | `npm run electron:dev` |
| **テスト** | `test-data/game-dict-test.db`                          | `test-data/csv/` | `npm test`             |

**重要**: `npm start`は本番用の日常利用コマンドです。NODE_ENV=productionが設定され、必ずユーザーデータディレクトリを使用します。

### プロジェクト構造

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

### データベース

- **場所**: `~/Library/Application Support/game-dict/game-dict.db` (本番)
- **テスト**: `./test-data/game-dict.db` (テスト時)
- **スキーマ**: games, categories, entries の3テーブル
- **デフォルトカテゴリ**: 名詞、品詞なし、人名（名詞を初期選択）

### 機能概要

#### データ管理（設計思想）

- **権威あるデータ**: CSV（`csv/`）による永続化・Git差分管理
- **一時作業DB**: SQLite（高速CRUD・検索、起動時CSV読込・確定時CSV出力）
- **完全データ構成**: games.csv + categories.csv + game-{ID}.csv

#### UI機能

- **ゲーム管理**: 複数ゲームの辞書を独立管理
- **インライン単語編集**: 読み・単語・カテゴリ・説明のCRUD操作（常時インライン表示）
- **自動保存機能**: フォーカスアウト時の自動保存
- **連続登録**: 登録後即座に次の単語入力を開始
- **検索機能**: 読みまたは単語での部分一致検索

#### CSV機能

- **Git管理用CSV**: 完全データ出力（games + categories + entries）
- **IME辞書用CSV**: Google・MS-IME・ATOK対応の辞書形式出力
- **CSV一括取込**: ディレクトリから完全復元（初回起動・チェックアウト後）

#### IME辞書出力機能

- **Microsoft IME形式**: reading \t word \t category_name のタブ区切りUTF-8テキスト
- **ファイル名**: game codeを使用（`{game_code}.txt`）
- **出力先**: `export/` ディレクトリに自動生成
- **スマート制御**: 単語がない場合は出力ボタン無効化
- **エラーハンドリング**: 適切な検証とユーザーフィードバック

---

## 🔧 **ネイティブモジュール管理（重要）**

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

---

### トラブルシューティング

#### ビルドエラー

```bash
# TypeScriptコンパイルエラーの場合
npm run build

# 依存関係の問題
rm -rf node_modules package-lock.json
npm install
```

#### データベースエラー

```bash
# テストデータクリーンアップ
npm run test:clean

# テスト再実行
npm run test:db
```

#### Electronが起動しない

- `dist/` フォルダが生成されているか確認
- `npm run build` でビルド完了後に実行

#### better-sqlite3エラー (NODE_MODULE_VERSION不一致)

**通常は自動化済み** - 以下のコマンドが自動的にリビルドを実行します：
- `npm test` (Node.js用リビルド付き)
- `npm run test:e2e` (Electron用リビルド付き)
- `npm install` (postinstallでElectron用リビルド)

**手動リビルドが必要な場合**:
```bash
# Electronアプリでエラーが出る場合
npm run rebuild:electron

# Vitestテストでエラーが出る場合
npm run rebuild:node

# 注意: 自動化により手動実行は通常不要
```

### プロジェクトメモ

#### 開発メモ

- **重要：調査中のバグ**:
  - e2eテストを実行する際、Node.jsのバージョンに起因するエラーが発生することがある。もし発生したら原因を切り分けて念入りに調査すること

#### 開発ガイドライン

- コードを追加・変更する際は、以下の各ステップでコミットを分けてください：

  1. 対象の機能をドキュメント化し、ユーザーと認識をあわせる。ユーザーの要望にただ従うのではなく、リスクや検討漏れがないかを考慮して最適な仕様を一緒に考える。機能の目的を意識し、不明な場合はこの段階でユーザーに確認する。
  2. 対象のテストがなければ追加する。この段階ではエラーになってかまわない（TDD）
  3. テストが通るように機能を実装し、ユーザーに報告する。ユーザーとの会話で調整された仕様があれば、ドキュメントに反映する。

- テストが実行できない状態は許容しない。解決しない場合はエラー内容等をドキュメント化し、将来再発時の調査に使えるようにする。
- タスクはコンテキストではなくCLAUDE.mdで管理する（CLAUDE.mdから次のタスクを選定し、必要に応じて分割する）
- テストはできるだけシンプルかつ高速を目指す。例：DB状態に関連したロジックテストはできるだけ単体テストに切り離し、E2Eテストはロジックを意図した引数で呼んでいるかの確認に留める
- テスト内容を調整する際は、それがテストの目的と照らして正しいかを客観的に考える。例：アプリ利用時の操作を再現するためではなく、失敗するテストを通すためだけにUI要素を操作するのはNG。

---

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

---
