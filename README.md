# IME辞書管理ツール

ゲーム専門用語のIME辞書を効率的に管理するElectronアプリケーション

## 概要

このプロジェクトは、複数ゲームの専門用語辞書を一元管理するためのElectronアプリです。  
SQLiteデータベースをローカルに持ち、CSVファイルと連携して辞書データの編集・管理・出力を行います。

- Electronによるクロスプラットフォーム対応のUI
- SQLiteによる高速で軽量なデータ管理
- CSVとの双方向入出力によるGitでの履歴管理
- IME登録用辞書ファイルの自動生成

---

## 主要機能

### データ管理
- 複数ゲームの辞書データをゲーム名・カテゴリで管理
- SQLite DB上での編集を即時反映
- CSVファイルのインポート・エクスポート対応
- Git管理による変更履歴の追跡

### UI機能
- インライン編集によるスムーズな単語登録・編集
- 高速な検索機能（読み・単語の部分一致）
- ゲーム間での辞書データ切り替え
- 自動保存機能による作業効率向上

### IME辞書出力
- Microsoft IME形式の辞書ファイル生成
- ゲーム別の辞書ファイル（.txt形式）
- スマートボタン制御（単語がない場合は無効化）

---

## 技術スタック

- **言語**: TypeScript
- **UI**: Electron v36.5.0 + HTML/CSS/JavaScript
- **データベース**: SQLite (better-sqlite3 + DrizzleORM)
- **CSV処理**: csv-parse/csv-stringify
- **テスト**: Vitest + Playwright (53テスト・100%成功)
- **品質管理**: Biome + Prettier
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
```

### 日常の使用

```bash
# アプリケーション起動（本番利用）
npm start

# 開発用起動
npm run electron:dev
```

### 開発コマンド

```bash
# 開発時のウォッチビルド
npm run dev

# テスト実行
npm test

# コード品質チェック
npm run lint
npm run lint:fix

# アプリケーションパッケージング
npm run dist          # 現在のプラットフォーム
npm run dist:mac       # macOS
npm run dist:win       # Windows  
npm run dist:linux     # Linux
```

---

## 使い方

1. **アプリ起動**: `npm start` でElectronアプリを起動
2. **ゲーム管理**: サイドバーからゲームを選択・追加・編集
3. **単語編集**: 選択したゲームの単語を追加・編集・削除
4. **検索機能**: 読みや単語での部分一致検索
5. **CSV操作**: Git管理用CSV出力・一括取込
6. **IME辞書出力**: Microsoft IME用辞書ファイルの生成

### データの場所

- **本番データ**: `~/Library/Application Support/game-dict/`
- **CSVファイル**: プロジェクトの `csv/` ディレクトリ
- **IME辞書**: プロジェクトの `export/` ディレクトリ

---

## プロジェクト状況

- **開発状況**: **全機能完成・安定動作確認済み**
- **実装完了**: SQLite・CSV・IPC・UI・IME出力
- **テスト**: 53/53 Pass (100%成功率)
- **対応プラットフォーム**: macOS・Windows・Linux

---

## トラブルシューティング

### better-sqlite3エラーが発生する場合

```bash
# Electronの Node.js バージョン向けにリビルド
npm run rebuild:electron

# または Node.js向けにリビルド
npm run rebuild:node
```

### アプリが起動しない場合

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# ビルド後に起動
npm run build
npm start
```

### 詳細なドキュメント

- **開発ガイド**: `docs/DEVELOPMENT.md`
- **技術アーキテクチャ**: `docs/ARCHITECTURE.md`
- **運用ガイド**: `CLAUDE.md`

---

## ライセンス

本プロジェクトは **MIT License** で公開しています。  
詳細は [LICENSE](./LICENSE) ファイルを参照ください。

---

## 連絡先

質問・要望などありましたらIssueやメールでお知らせください。