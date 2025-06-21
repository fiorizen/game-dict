# IME辞書管理ツール（Electron + SQLite）

## 概要

このプロジェクトは、複数ゲームの専門用語辞書を一元管理するためのElectronアプリです。  
SQLiteデータベースをローカルに持ち、CSVファイルと連携して辞書データの編集・管理・出力を行います。

- Electronによるクロスプラットフォーム対応のUI
- SQLiteによる高速で軽量なデータ管理
- CSVとの双方向入出力によるGitでの履歴管理
- IME登録用CSVも簡単に出力可能

---

## 主要機能

- 複数ゲームの辞書データをゲーム名・カテゴリで管理
- SQLite DB上での編集を即時反映
- CSVファイルのインポート・エクスポート対応
- 編集内容の確定操作でGit管理用CSVを更新
- IME辞書登録用CSVファイルの出力

---

## 技術スタック

- **言語**: TypeScript
- **UI**: Electron v36.5.0 + HTML/CSS/JavaScript
- **データベース**: SQLite (better-sqlite3)
- **CSV処理**: csv-parse/csv-stringify
- **テスト**: Vitest + Vite (12テスト・Electron環境動作確認済み)
- **品質管理**: Biome (Lint・Format) + Prettier (Markdown)
- **パッケージング**: electron-builder
- **Node.js**: 22.16.0+

---

## セットアップ・実行

### 初回セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd game-dict

# 依存関係インストール
npm install

# TypeScriptビルド
npm run build

# Electronアプリ起動
npm run electron:dev
```

### 開発コマンド

```bash
# 開発時のウォッチビルド
npm run dev

# テスト実行
npm test

# データベーステストのみ
npm run test:db

# コード品質チェック
npm run lint
npm run lint:fix

# アプリケーションパッケージング
npm run dist          # 現在のプラットフォーム
npm run dist:mac       # macOS
npm run dist:win       # Windows
npm run dist:linux     # Linux
```

### トラブルシューティング

#### better-sqlite3エラーが発生する場合

```bash
# Electronの Node.js バージョン向けにリビルド
npx @electron/rebuild
```

#### アプリが起動しない場合

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# ビルド後に起動
npm run build
npm run electron
```

---

## ライセンス

本プロジェクトは **MIT License** で公開しています。  
詳細は [LICENSE](./LICENSE) ファイルを参照ください。

---

## 使い方

1. **アプリ起動**: `npm run electron:dev` でElectronアプリを起動
2. **ゲーム管理**: サイドバーからゲームを選択・追加
3. **単語編集**: 選択したゲームの単語を追加・編集・削除
4. **検索機能**: 読みや単語での部分一致検索
5. **カテゴリフィルター**: IME形式別カテゴリで絞り込み
6. **CSV操作**: インポート・エクスポート機能
   - エクスポート: Git管理用、Google日本語入力、MS-IME、ATOK対応
   - インポート: CSV形式でのデータ一括登録

### データベース

- **本番**: `~/Library/Application Support/game-dict/game-dict.db`
- **テスト**: `./test-data/game-dict.db`
- **デフォルトカテゴリ**: 人名、地名、技名・スキル、アイテム、モンスター、組織・団体

### プロジェクト状態

- **開発状況**: **Electronアプリ起動確認済み・UI機能テスト段階**
- **実装状況**: SQLite・CSV・IPC・UI実装完了
- **テスト**: 12/12 Pass (SQLiteデータベース層)
- **Electronアプリ**: 起動確認済み・UI機能動作テスト未実施

---

## 連絡先

質問・要望などありましたらIssueやメールでお知らせください。
