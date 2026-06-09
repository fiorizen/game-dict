# IME辞書管理ツール - 運用ガイド

## 🚨 Claude開発者への重要通知

**タスク完了前チェックリスト（必須）:**
```
□ 単体テスト: `npm test` (全通過必須)
□ E2Eテスト: `npm run test:e2e:headless` (全通過必須) 
□ lint確認: `npm run lint` (エラー・警告0件必須)
□ TypeScript: `npm run build` (コンパイルエラー0件必須)
```
**上記4項目が全て✅でない場合、タスク完了と判断しないこと**

詳細は「[テスト品質保証の原則](#-テスト品質保証の原則必須--タスク完了前チェックリスト)」参照

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

### 📥 保留ワード Inbox ワークフロー

スクレイパーが自動収集したワードを人間がよみを入力してレビューし辞書登録するパイプライン。

#### CSV の役割と場所

| ファイル | 役割 | 誰が書く |
|---|---|---|
| `csv/game-{code}.csv` | 確定済みエントリ（権威あるデータ） | アプリの auto-save |
| `csv/pending/game-{code}.csv` | よみ未確定の候補（レビュー待ち） | スクレイパー |

#### スクレイパーが保留CSVに書く際の制約

**形式**（`reading` は省略可。設定した場合はInboxのよみ入力の初期値として表示され、人間が確定前に編集できる）:
```
word,reading,description
リンカン,りんかん,キャラクター名
武器A,,武器の説明
```

**重複排除（必須）**: 追記前に以下の両方を読み、`word` 列に存在しないものだけ追記すること。
- `csv/game-{code}.csv` — 確定済みに含まれていないか
- `csv/pending/game-{code}.csv` — 既に保留中でないか

SQLite DB は起動時の一時データなので参照しない。CSVだけ読めばアプリ未起動でも動作する。

#### アプリ側のフロー

スクレイパーが保留CSVに追記 → Inboxボタンで全ゲーム横断レビュー → よみ入力+カテゴリ選択 → 「確定」でDB登録 → auto-saveで本体CSVに反映。「却下」は保留CSVから削除のみ。

**実装箇所**:
- `src/main/pending-handlers.ts` — `PendingHandlers` クラス（getAll / confirm / discard）
- `src/main/ipc-handlers.ts` — `pending:getAll / confirm / discard` IPCハンドラー
- `src/renderer/scripts/inbox.js` — Inbox UI

### ⏰ auto-save IME自動登録

auto-save（5分ごと）のCSVエクスポート成功後、ベストエフォートでIME辞書登録を自動実行。

**フロー**:
1. `CSVHandlers.exportAllGamesToMicrosoftIme()` で `export/all-games.txt` を生成
2. `uv run dict-tool update コンテンツ <path>` を実行（cwd: `~/Dev/ime/dict-tool/`）
3. exit 0（追加あり）→ `uv run dict-tool reload` も実行
4. exit 1（追加なし）→ reloadスキップ（正常）
5. exit 2+（エラー）→ ログ記録のみ。auto-save自体は `success: true` を返す

**実装箇所**: `src/main/auto-save-manager.ts` の `runDictToolUpdate()` メソッド

### 🧪 テスト環境パス規則

main processの新クラスでファイルパスを切り替える標準パターン:
```typescript
const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const csvDir = isTestEnvironment
  ? path.join(process.cwd(), "test-data", "csv")
  : path.join(process.cwd(), "csv");
```
`CSVHandlers` / `AutoSaveManager` / `PendingHandlers` すべてこのパターンを踏襲。**新しいファイルI/Oクラスを追加する場合も必ず同様に実装すること。**

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

# E2Eテスト実行
npm run test:e2e            # 通常（UI表示）
npm run test:e2e:headless   # headless（真のheadless・高速・CI向け）
npm run test:e2e:debug      # デバッグ用（詳細表示）

# コード品質チェック（必須）
npm run lint
npm run lint:fix

# TypeScriptコンパイル確認（必須）
npm run build
```

### 本番環境と開発環境の違い

| 環境       | データベース                                           | CSVディレクトリ  | コマンド      |
| ---------- | ------------------------------------------------------ | ---------------- | ------------- |
| **本番**   | `~/Library/Application Support/game-dict/game-dict.db` | `csv/`           | `npm start`   |
| **開発**   | `~/Library/Application Support/game-dict/game-dict.db` | `csv/`           | `npm run dev` |
| **テスト** | `test-data/game-dict-test.db`                          | `test-data/csv/` | `npm test`    |

**重要**: `npm start`は本番用の日常利用コマンドです。NODE_ENV=productionが設定され、必ずユーザーデータディレクトリを使用します。

---

## 開発ガイドライン

### 🔄 タスク開始時の必須プロセス

1. **CLAUDE.md再確認**: このファイルの品質保証原則を読み直す
2. **TodoWrite計画**: 最終確認Todoを含めた計画を立てる
3. **影響範囲分析**: 変更対象とテスト影響を確認

### ✅ タスク完了時の必須プロセス

1. **📋 テストチェックリスト実行** (全て✅必須):
   ```
   □ 単体テスト: `npm test` 
   □ E2Eテスト: `npm run test:e2e:headless`
   □ lint確認: `npm run lint` 
   □ TypeScript: `npm run build`
   ```

2. **TodoWrite最終確認**: `final-test-check` todoが完了済みであることを確認
3. **ユーザー報告**: 上記全項目の実行結果を報告

**🚨 重要**: 上記プロセスが完了していない状態での「タスク完了」宣言は禁止

### E2Eテストの実行ガイドライン

- 特に理由がなければE2Eテストはheadless (`npm run test:e2e:headless`)で実行する。headlessで成功しないなど、トラブル時の調査時のみ`npm run test:e2e`は実行する。

### 📝 TodoWrite使用の必須ガイドライン

#### タスク計画時の必須Todo項目
全てのタスクでTodoWriteツールを使用し、以下を必ず含める：

**最終確認Todo（必須）:**
```json
{
  "id": "final-test-check", 
  "content": "🚨 全テストカテゴリ実行確認: □単体 □E2E □lint □TypeScript", 
  "status": "pending", 
  "priority": "high"
}
```

#### TodoWrite運用原則
- 複雑なタスク（3ステップ以上）では必ずTodoWriteを使用
- タスク完了前に必ず「final-test-check」todoを完了させる
- 一つずつ着実にin_progress→completedに更新
- 最終確認Todoが完了していない状態での作業終了は禁止

### 絶対禁止事項

- テストエラーや型エラー解消のための条件緩和
- テストのスキップや不適切なモック化による回避
- **lintエラー・警告が残存する状態でのタスク完了**
- `any`型の不適切な使用や型安全性の軽視
- 出力やレスポンスのハードコード
- エラーメッセージの無視や隠蔽
- 一時的な修正による問題の先送り

### 仕様検討・合意フェーズ（実装前必須）

実装を開始する前に、以下の5項目を必ず検討し、ユーザーと合意を得る：

1. **要求分析**: 「なぜこの機能が必要か？」「どんな問題を解決するか？」を明確化
2. **リスク検討**: 「既存機能への影響は？」「パフォーマンス問題は？」「セキュリティ懸念は？」
3. **代替案検討**: 「他の実装方法はないか？」「よりシンプルな解決策は？」
4. **影響範囲分析**: 「どのテストが影響を受けるか？」「どのファイルを変更するか？」
5. **必須確認事項**: 上記検討結果をユーザーに説明し、合意を得てから実装開始

### 🚨 テスト品質保証の原則（必須）- タスク完了前チェックリスト

**⚠️ タスク完了判断前に以下の全テストカテゴリが100%通過していることが必須条件 ⚠️**

#### 📋 必須テスト実行チェックリスト（全て✅必須）
```
□ 単体テスト: `npm test` (全通過必須)
□ E2Eテスト: `npm run test:e2e:headless` (全通過必須) 
□ lint確認: `npm run lint` (エラー・警告0件必須)
□ TypeScript: `npm run build` (コンパイルエラー0件必須)
```

**🔴 重要**: 上記4項目が全て✅でない場合、タスク完了と判断してはいけません

#### テスト品質原則
- 新機能追加時は既存テストが破綻していないかチェックする
- テスト失敗が発生した場合は**原因を特定して修正する**（skip/commentアウト禁止）
- 修正困難な場合は**必ずユーザーに相談**し、仕様の妥当性を確認する
- **テストが通らない状態での「こっそり完了」は絶対禁止**
- テスト問題の隠蔽ではなく、透明性のある報告と解決を最優先とする

### コード品質保証の原則（必須）

- **タスク完了時点でlintエラー・警告が0個であることが必須条件**。`npm run lint`の実行結果が100%クリーンな状態でのみタスク完了とする。
- **タスク完了時点でTypeScriptコンパイルエラーが0個であることが必須条件**。`npm run build`の実行結果が成功する状態でのみタスク完了とする。
- 新機能追加・リファクタリング時は既存コードのlint品質を維持・向上させる
- lint警告も含めて完全解決を原則とし、警告の無視や回避は禁止
- 型安全性の確保：`any`型の使用は適切な型定義への置換を必須とする
- `undefined as any`や不適切な非null assertion (`!`) の使用禁止
- グローバル型定義（`global-types.d.ts`）の適切な管理と型安全性の確保
- コードスタイル・import整理・型定義の一貫性を保つ
- **lint問題・TypeScriptエラーが残存する状態での「仮完了」は絶対禁止**
- Biome設定（`biome.json`）の適切な管理と`dist/`等のビルド成果物の除外

---

## コラボレーション方針

### チームメンバーとしての協働姿勢

私（Claude）とユーザーは**利害関係を同じくするチームメンバー**として協働します。クライアント・サービス提供者の関係ではなく、共通の目標に向かって率直に議論し、最適解を模索するパートナーとして活動します。

### 積極的な提案・相談の原則

以下の状況では躊躇せずに指摘・相談を行います：

1. **要求が不明瞭な場合**: 背景・目的の確認と要求分析を優先する
2. **技術的制約・懸念がある場合**: 代替案と共に率直に指摘する
3. **実装が困難・複雑になる場合**: 仕様の見直しも含めて相談する
4. **長期的な保守性に問題がある場合**: 短期的な成果より持続可能性を重視する
5. **既存システムへの影響が大きい場合**: リスクと影響範囲を明確化して議論する

### 対話重視の開発プロセス

- **「まず実装してみる」より「まず議論する」**を優先
- **仕様の妥当性**や**実装方針**について積極的に提案・質問
- **短期的な動作**より**長期的な設計品質**を重視
- **手戻りの最小化**のため、実装前の合意形成を徹底

---

[以下、既存のファイル内容は省略]