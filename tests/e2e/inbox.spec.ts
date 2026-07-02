import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
	type ElectronApplication,
	_electron as electron,
	type Page,
} from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "../..");
// E2E は NODE_ENV=test で起動するため test-data/csv を参照する
const pendingDir = path.join(projectRoot, "test-data", "csv", "pending");
// 実データと衝突しにくいユニークなテスト用ゲームコード
const testCode = "e2einboxtest";
const pendingFile = path.join(pendingDir, `game-${testCode}.csv`);

function writePending(): void {
	fs.mkdirSync(pendingDir, { recursive: true });
	fs.writeFileSync(
		pendingFile,
		"word,reading,description,category_name\n" +
			"E2Eテスト単語A,,説明A,\n" +
			"E2Eテスト単語B,てすとびー,説明B,\n",
		"utf-8",
	);
}

function cleanup(): void {
	if (fs.existsSync(pendingFile)) {
		fs.rmSync(pendingFile);
	}
}

test.describe("Inbox", () => {
	let electronApp: ElectronApplication;
	let page: Page;

	test.beforeAll(async () => {
		writePending();
		electronApp = await electron.launch({
			args: [path.join(__dirname, "../../dist/main/main.js")],
			cwd: projectRoot,
		});
		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
		// window.confirm を常に承認
		page.on("dialog", (dialog) => dialog.accept());
	});

	test.afterAll(async () => {
		if (electronApp) {
			await electronApp.close();
		}
		cleanup();
	});

	test("Inboxを開くと保留エントリが行として表示される", async () => {
		await page.click("#inbox-btn");
		await expect(page.locator("#inbox-view")).toBeVisible();

		const rows = page.locator("#inbox-table-body .pending-entry");
		await expect(rows).toHaveCount(2);
	});

	test("単語セルが編集可能な入力欄になっている", async () => {
		const wordInputs = page.locator("#inbox-table-body .word-input");
		await expect(wordInputs.first()).toBeVisible();
		await expect(wordInputs.first()).toHaveValue("E2Eテスト単語A");
	});

	test("よみ列は単語列より広い（自動調整・単語優先）", async () => {
		const wordWidth = await page
			.locator("#inbox-table th:nth-child(2)")
			.evaluate((el) => el.getBoundingClientRect().width);
		const yomiWidth = await page
			.locator("#inbox-table th:nth-child(4)")
			.evaluate((el) => el.getBoundingClientRect().width);
		expect(yomiWidth).toBeGreaterThan(wordWidth);
	});

	test("単語をブラー編集すると保留CSVが更新される", async () => {
		const firstWord = page.locator("#inbox-table-body .word-input").first();
		await firstWord.fill("E2Eテスト単語A改");
		// ブラーを発生させる
		await page.locator("#inbox-count-header").click();
		await expect
			.poll(() => fs.readFileSync(pendingFile, "utf-8"))
			.toContain("E2Eテスト単語A改");
	});

	test("全却下で0件になるとInboxが解除されメインビューへ戻る", async () => {
		await page.click("#inbox-discard-all");

		await expect(page.locator("#inbox-view")).toBeHidden();
		await expect(page.locator("#main-view")).toBeVisible();
		await expect(page.locator("#inbox-btn")).not.toHaveClass(/active/);
		expect(fs.existsSync(pendingFile)).toBe(false);
	});
});
