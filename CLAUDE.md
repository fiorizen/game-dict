# IME辞書管理ツール プロジェクト設計書 / タスク指示書

---

## プロジェクト概要

複数のゲーム専門用語辞書をまとめて管理するElectronアプリ。  
SQLiteで高速なローカルDB管理を行い、Git管理用のCSVとの同期を実現。  
IME辞書登録用CSVも出力可能。

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

- Electronアプリ上でSQLite DBの読み書き
- ワードの一覧表示
- ワード単位の登録・編集UIと即時DB反映（自動保存）
- CSV更新をトリガーする「確定」UI（SQLite DBからGit管理用CSVへのエクスポート機能）
- 辞書登録用CSVへのフォーマット変換・出力（Google日本語入力用）
- CSVファイルからSQLite DBへのインポート機能（基本的にはチェックアウト後初回のみ利用）

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

## Claude Codeにお願いしたいタスク

- 各機能の詳細タスク分解と優先度付け（何をするべきかの認識合わせ）
- 未決定の仕様のうち、実装前に調整したほうがいいものの洗い出し・ドキュメント化（大きな手戻りの防止）
- 仕様から想定されるリスクの洗い出しと対策の提案
- SQLiteとCSV入出力の実装
- Electron UIのワイヤーフレーム・コンポーネント設計
- バリデーション・エラーハンドリング設計
- ビルドツールとテストフレームワークの候補提示・選定・構築

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
  - [x] 包括的テストスイート（11テスト、100% Pass）
  - [x] 自動テストデータクリーンアップ

- [ ] **Electronアプリ基本構造設計** (次のタスク)
  - [ ] メインプロセス・レンダラープロセス設計
  - [ ] IPC通信設計
  - [ ] ウィンドウ管理とUI基盤

- [ ] **CSV入出力機能の実装方針** (中優先度)
  - [ ] Git管理用CSVのインポート・エクスポート
  - [ ] IME辞書用CSV出力（Google日本語入力対応）

- [ ] **UI/UX設計とコンポーネント構成** (中優先度)
  - [ ] 一覧表示UI
  - [ ] 編集フォームUI
  - [ ] 検索・フィルター機能

- [ ] **実装優先順位と開発フェーズの決定** (高優先度)
  - [ ] 最終的な開発ロードマップ策定

### プロジェクト統計

- **完了率**: 4/8 タスク (50%)
- **コードテスト**: 11/11 Pass (100%)
- **技術基盤**: SQLite基盤完成
- **次フェーズ**: Electron統合

### 最新の技術決定事項

- **データベース**: better-sqlite3 (同期API、高速)
- **テストフレームワーク**: 独自テストランナー + tsx
- **型定義**: 完全なTypeScript型安全性
- **スキーマ**: games(id,name) / categories(id,name,ime_names) / entries(id,game_id,category_id,reading,word,description)

---
