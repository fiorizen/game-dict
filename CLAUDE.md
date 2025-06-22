# IME辞書管理ツール - 運用ガイド

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
npm run dev

# 開発時のウォッチビルド
npm run watch

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
| **開発**   | `~/Library/Application Support/game-dict/game-dict.db` | `csv/`           | `npm run dev` |
| **テスト** | `test-data/game-dict-test.db`                          | `test-data/csv/` | `npm test`             |

**重要**: `npm start`は本番用の日常利用コマンドです。NODE_ENV=productionが設定され、必ずユーザーデータディレクトリを使用します。

---

## 開発ガイドライン

### 仕様検討・合意フェーズ（実装前必須）

実装を開始する前に、以下の5項目を必ず検討し、ユーザーと合意を得る：

1. **要求分析**: 「なぜこの機能が必要か？」「どんな問題を解決するか？」を明確化
2. **リスク検討**: 「既存機能への影響は？」「パフォーマンス問題は？」「セキュリティ懸念は？」
3. **代替案検討**: 「他の実装方法はないか？」「よりシンプルな解決策は？」
4. **影響範囲分析**: 「どのテストが影響を受けるか？」「どのファイルを変更するか？」
5. **必須確認事項**: 上記検討結果をユーザーに説明し、合意を得てから実装開始

### テスト品質保証の原則（必須）

- **タスク完了時点でテストが100%通過していることが必須条件**
- 新機能追加時は既存テストが破綻していないかチェックする
- テスト失敗が発生した場合は**原因を特定して修正する**（skip/commentアウト禁止）
- 修正困難な場合は**必ずユーザーに相談**し、仕様の妥当性を確認する
- **テストが通らない状態での「こっそり完了」は絶対禁止**
- テスト問題の隠蔽ではなく、透明性のある報告と解決を最優先とする

---

## 機能概要

### データ管理（設計思想）

- **権威あるデータ**: CSV（`csv/`）による永続化・Git差分管理
- **一時作業DB**: SQLite（高速CRUD・検索、起動時CSV読込・確定時CSV出力）
- **完全データ構成**: games.csv + categories.csv + game-{ID}.csv

### UI機能

- **ゲーム管理**: 複数ゲームの辞書を独立管理
- **インライン単語編集**: 読み・単語・カテゴリ・説明のCRUD操作（常時インライン表示）
- **自動保存機能**: フォーカスアウト時の自動保存
- **連続登録**: 登録後即座に次の単語入力を開始
- **検索機能**: 読みまたは単語での部分一致検索

### CSV機能

- **Git管理用CSV**: 完全データ出力（games + categories + entries）
- **IME辞書用CSV**: Google・MS-IME・ATOK対応の辞書形式出力
- **CSV一括取込**: ディレクトリから完全復元（初回起動・チェックアウト後）

### IME辞書出力機能

- **Microsoft IME形式**: reading \t word \t category_name のタブ区切りUTF-8テキスト
- **ファイル名**: game codeを使用（`{game_code}.txt`）
- **出力先**: `export/` ディレクトリに自動生成
- **スマート制御**: 単語がない場合は出力ボタン無効化
- **エラーハンドリング**: 適切な検証とユーザーフィードバック

---

## トラブルシューティング

### ビルドエラー

```bash
# TypeScriptコンパイルエラーの場合
npm run build

# 依存関係の問題
rm -rf node_modules package-lock.json
npm install
```

### データベースエラー

```bash
# テストデータクリーンアップ
npm run test:clean

# テスト再実行
npm run test:db
```

### Electronが起動しない

- `dist/` フォルダが生成されているか確認
- `npm run build` でビルド完了後に実行

### better-sqlite3エラー (NODE_MODULE_VERSION不一致)

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

### Biome実行権限エラー

**問題**: `Error: spawnSync .../biome EACCES`

**解決策**:
```bash
# 自動実行（インストール時）
npm install  # postinstall hook で自動実行

# 手動実行（問題発生時）
npm run fix:biome-permissions

# 直接実行
chmod +x node_modules/@biomejs/cli-*/biome
```

---

## データベース

- **場所**: `~/Library/Application Support/game-dict/game-dict.db` (本番)
- **テスト**: `./test-data/game-dict.db` (テスト時)
- **スキーマ**: games, categories, entries の3テーブル
- **デフォルトカテゴリ**: 名詞、品詞なし、人名（名詞を初期選択）

---

## カスタムコマンド

プロジェクトには以下のカスタムClaude Codeコマンドが設定されています：

### クイックコミット
```
/commit
```
- 現在の変更を自動的にステージング・コミット
- 適切なコミットメッセージを自動生成
- Claude Code attribution付きでコミット実行

### 詳細コミット
```
/project:smart-commit  
```
- より詳細な分析とステップバイステップ処理
- 段階的なコミット確認

---

## ドキュメント構成

- **CLAUDE.md** (このファイル): 日常運用ガイド
- **README.md**: ユーザー向け基本情報
- **docs/DEVELOPMENT.md**: 開発詳細ガイド
- **docs/ARCHITECTURE.md**: 技術アーキテクチャ詳細
- **docs/UI-REQUIREMENTS.md**: UI仕様詳細
- **docs/DATABASE_TESTING.md**: テスト手順詳細
- **docs/PROJECT_HISTORY.md**: 開発履歴・進捗詳細

---

## プロジェクト統計

- **完了率**: 18/18 メインタスク (100%) + IME機能実装完了
- **テスト成功率**: 53/53 Pass (100%成功率)
- **アプリ状態**: **全機能完成・完全統合・安定動作確認済み**
- **技術基盤**: DrizzleORM + SQLite + Vitest + Electron v36
- **品質管理**: Biome + 自動権限修正 + プリビルドバイナリ最適化