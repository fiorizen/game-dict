import { expect, test } from "@playwright/test";
import { ElectronApplication, type Page, _electron as electron } from "playwright";

test.describe("Word Filter TDD Tests", () => {
	let electronApp: ElectronApplication;
	let page: Page;

	test.beforeEach(async () => {
		electronApp = await electron.launch({
			args: ["dist/main/main.js"],
			env: { ...process.env, NODE_ENV: "test" },
		});
		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
	});

	test.afterEach(async () => {
		await electronApp.close();
	});

	// 🟢 Green: 最小限のテストを通す
	test("フィルター入力が存在し、入力できる", async () => {
		// フィルター入力要素が存在することを確認
		const filterInput = page.locator("#filter-input");
		await expect(filterInput).toBeVisible();

		// フィルター入力にテキストを入力できることを確認
		await filterInput.fill("テスト");
		await expect(filterInput).toHaveValue("テスト");
	});

	// 🟢 Green: Command+Fテストもシンプルに
	test("Command+Fでフィルター入力にフォーカスする", async () => {
		const filterInput = page.locator("#filter-input");
		await expect(filterInput).toBeVisible();

		// 別の要素にフォーカスを当てる
		await page.click("body");
		
		// Command+Fキーを押す
		await page.keyboard.press("Meta+f");

		// フィルター入力にフォーカスが当たることを確認
		await expect(filterInput).toBeFocused();
	});

	// 🟢 Green: ゲーム切り替えテストもシンプルに
	test("ゲーム切り替えでフィルタークエリがリセットされる", async () => {
		const filterInput = page.locator("#filter-input");
		await expect(filterInput).toBeVisible();

		// フィルター入力にテキストを入力
		await filterInput.fill("検索テキスト");
		await expect(filterInput).toHaveValue("検索テキスト");

		// ゲーム選択を変更（空の選択肢→空の選択肢でもリセットされることをテスト）
		const gameSelect = page.locator("#game-select");
		await gameSelect.selectOption({ value: "" });

		// フィルター入力がクリアされることを確認
		await expect(filterInput).toHaveValue("");
	});
});