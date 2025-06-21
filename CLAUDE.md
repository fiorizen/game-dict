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

- **コードフォーマット・Lint:** Biomeを採用  
- **エディタ共通設定:** EditorConfig（一般的なルールで生成）  
- **ビルドツール:** プロジェクト構成に適したものをClaude Codeにて選定
- **Gitコミット前処理:** huskyを用いコミット前にBiome自動実行を設定  
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
2. SQLite DB設計・マイグレーション実装
3. CSV入出力機能（インポート・エクスポート）  
4. Electron UI基本画面（一覧、編集、絞り込み）  
5. 編集内容の即時SQLite反映処理  
6. 確定操作によるCSV更新機能実装  
7. 辞書登録用CSVの出力処理  
8. Git連携ルール整備（.gitignore設定含む）  
9. テストコード整備（単体テスト・E2E）  
10. ドキュメント作成  

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

- 各機能の詳細タスク分解と優先度付け  
- Biome導入
- SQLiteとCSV入出力の実装
- Electron UIのワイヤーフレーム・コンポーネント設計  
- バリデーション・エラーハンドリング設計  
- テストコード構成案  
- ビルドツールとテストフレームワークの候補提示・選定・設定案作成  

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
- 必要に応じて再指示でCLAUDE.mdをアップデート  

---
