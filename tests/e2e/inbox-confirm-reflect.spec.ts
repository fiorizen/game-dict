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
const pendingDir = path.join(projectRoot, "test-data", "csv", "pending");
const gameName = "確定反映テストゲーム";
const gameCode = "kakuteihanei";
const confirmWord = "確定反映単語X";

test.describe("Inbox 全確定後のメインビュー反映", () => {
	let electronApp: ElectronApplication;
	let page: Page;
	let pendingFile = "";

	test.beforeAll(async () => {
		electronApp = await electron.launch({
			args: [path.join(__dirname, "../../dist/main/main.js")],
			cwd: projectRoot,
		});
		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
		page.on("dialog", (dialog) => dialog.accept());

		// テスト用ゲームを find-or-create（再実行時に重複追加しない）
		const gameSelect = page.locator("#game-select");
		let option = gameSelect.locator("option").filter({ hasText: gameName });
		if ((await option.count()) === 0) {
			await page.click("#add-game-btn");
			await page.locator("#game-name").fill(gameName);
			// 日本語名は code が自動生成されないため明示的に入力する
			await page.locator("#game-code").fill(gameCode);
			await page.locator('#game-form button[type="submit"]').click();
			await expect(page.locator("#game-modal")).not.toBeVisible();
			await page.waitForTimeout(300);
			option = gameSelect.locator("option").filter({ hasText: gameName });
		}
		const optionValue = await option.getAttribute("value");
		if (!optionValue) throw new Error("テストゲームの準備に失敗しました");
		await gameSelect.selectOption(optionValue);

		// 保留CSVを用意（reading入力済みで全確定が走るように）
		fs.mkdirSync(pendingDir, { recursive: true });
		pendingFile = path.join(pendingDir, `game-${gameCode}.csv`);
		fs.writeFileSync(
			pendingFile,
			`word,reading,description,category_name\n${confirmWord},かくていはんえい,説明,\n`,
			"utf-8",
		);
	});

	test.afterAll(async () => {
		if (electronApp) {
			await electronApp.close();
		}
		if (pendingFile && fs.existsSync(pendingFile)) {
			fs.rmSync(pendingFile);
		}
	});

	test("全確定でInboxが解除された後、確定した単語がメインビューに表示される", async () => {
		// Inboxを開く
		await page.click("#inbox-btn");
		await expect(page.locator("#inbox-view")).toBeVisible();
		await expect(page.locator("#inbox-table-body .pending-entry")).toHaveCount(
			1,
		);

		// 全確定（dialogは自動承認）
		await page.click("#inbox-confirm-all");

		// Inboxが解除されメインビューに戻る
		await expect(page.locator("#main-view")).toBeVisible();
		await expect(page.locator("#inbox-view")).toBeHidden();

		// 確定した単語がメインビューのエントリ一覧に反映されている
		await expect(
			page.locator("#entries-table-body .entry-value", {
				hasText: confirmWord,
			}),
		).toHaveCount(1);
	});
});
