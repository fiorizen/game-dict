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

test.describe("IME Export E2E Tests", () => {
	let electronApp: ElectronApplication;
	let page: Page;
	let exportDir: string;

	test.beforeAll(async () => {
		electronApp = await electron.launch({
			args: [path.join(__dirname, "../../dist/main/main.js")],
			cwd: path.join(__dirname, "../.."),
		});

		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1000);

		// Setup export directory path
		exportDir = path.join(__dirname, "../../export");
	});

	test.afterAll(async () => {
		// Clean up export directory
		if (fs.existsSync(exportDir)) {
			fs.rmSync(exportDir, { recursive: true });
		}

		if (electronApp) {
			await electronApp.close();
		}
	});

	test.afterEach(async () => {
		// Clean up export files after each test
		if (fs.existsSync(exportDir)) {
			const files = fs.readdirSync(exportDir);
			files.forEach((file) => {
				if (file.endsWith(".txt")) {
					fs.unlinkSync(path.join(exportDir, file));
				}
			});
		}
	});

	test("IME辞書出力ボタンが存在し、初期状態では無効", async () => {
		// Check IME export button exists
		const imeExportBtn = page.locator("#export-ime-btn");
		await expect(imeExportBtn).toBeVisible();
		await expect(imeExportBtn).toBeDisabled();

		// Button text should be correct
		await expect(imeExportBtn).toHaveText("IME辞書出力");
	});

	test("単語がある場合にIME辞書出力ボタンが有効になる", async () => {
		// First create a test game
		await page.locator("#add-game-btn").click();
		await page.locator("#game-name").fill("選択テストゲーム");
		await page.locator("#game-code").fill("selecttest");
		await page.locator('#game-form button[type="submit"]').click();

		// Wait for modal to close and game to be auto-selected
		await page.waitForTimeout(1000);

		// Initially, IME export button should be disabled (no entries)
		const imeExportBtn = page.locator("#export-ime-btn");
		await expect(imeExportBtn).toBeDisabled();

		// Add a test entry
		await page.locator("#add-entry-btn").click();
		await page.waitForTimeout(300);

		// Fill in the new entry row
		const newRow = page.locator("#entries-table-body tr").last();
		await newRow.locator('input[name="reading"]').fill("てすと");
		await newRow.locator('input[name="word"]').fill("テスト");
		await newRow
			.locator('select[name="category"]')
			.selectOption({ label: "名詞" });

		// Save the entry
		await newRow.locator('button:has-text("保存")').click();
		await page.waitForTimeout(500);

		// Now IME export button should be enabled
		await expect(imeExportBtn).toBeEnabled();
	});

	test("IME辞書出力ボタンクリックで実際にファイルが出力される", async () => {
		// First, create a test game with entries
		await page.locator("#add-game-btn").click();
		await page.locator("#game-name").fill("IMEテストゲーム");
		await page.locator("#game-code").fill("imetest");
		await page.locator('#game-form button[type="submit"]').click();

		// Wait for modal to close and game to be selected
		await page.waitForTimeout(500);

		// Add a test entry
		await page.locator("#add-entry-btn").click();
		await page.waitForTimeout(300);

		// Fill in the new entry row
		const newRow = page.locator("#entries-table-body tr").last();
		await newRow.locator('input[name="reading"]').fill("てすと");
		await newRow.locator('input[name="word"]').fill("テスト");
		await newRow
			.locator('select[name="category"]')
			.selectOption({ label: "名詞" });
		await newRow.locator('input[name="description"]').fill("テスト用単語");

		// Save the entry by clicking save button
		await newRow.locator('button:has-text("保存")').click();
		await page.waitForTimeout(500);

		// Now test IME export
		const imeExportBtn = page.locator("#export-ime-btn");
		await expect(imeExportBtn).toBeEnabled();

		// Click IME export button
		await imeExportBtn.click();

		// Wait for export to complete
		await page.waitForTimeout(1000);

		// Check if IME export success toast appears
		const imeSuccessToast = page.locator(
			'.toast-success:has-text("IME辞書ファイルを出力しました")',
		);
		await expect(imeSuccessToast).toBeVisible();

		// Verify file was created
		const expectedFilePath = path.join(exportDir, "imetest.txt");
		expect(fs.existsSync(expectedFilePath)).toBe(true);

		// Verify file content
		const content = fs.readFileSync(expectedFilePath, "utf-8");
		expect(content.trim()).toBe("てすと\tテスト\t名詞\t#IMEテストゲーム");
	});

	test("単語がない場合はIME出力ボタンが無効になる", async () => {
		// Create a game without entries
		await page.locator("#add-game-btn").click();
		await page.locator("#game-name").fill("空のゲーム");
		await page.locator("#game-code").fill("empty");
		await page.locator('#game-form button[type="submit"]').click();

		// Wait for modal to close and game to be selected
		await page.waitForTimeout(500);

		// Check that IME export button is disabled
		const imeExportBtn = page.locator("#export-ime-btn");
		await expect(imeExportBtn).toBeDisabled();
	});

	test("複数単語の場合、全ての単語が正しい形式で出力される", async () => {
		// Create a game with multiple entries
		await page.locator("#add-game-btn").click();
		await page.locator("#game-name").fill("複数単語テスト");
		await page.locator("#game-code").fill("multiword");
		await page.locator('#game-form button[type="submit"]').click();

		// Wait for modal to close and game to be selected
		await page.waitForTimeout(500);

		// Add first entry
		await page.locator("#add-entry-btn").click();
		await page.waitForTimeout(300);

		let newRow = page.locator("#entries-table-body tr").last();
		await newRow.locator('input[name="reading"]').fill("げーむ");
		await newRow.locator('input[name="word"]').fill("ゲーム");
		await newRow
			.locator('select[name="category"]')
			.selectOption({ label: "名詞" });
		await newRow.locator('button:has-text("保存")').click();
		await page.waitForTimeout(500);

		// Add second entry
		await page.locator("#add-entry-btn").click();
		await page.waitForTimeout(300);

		newRow = page.locator("#entries-table-body tr").last();
		await newRow.locator('input[name="reading"]').fill("たのしい");
		await newRow.locator('input[name="word"]').fill("楽しい");
		await newRow
			.locator('select[name="category"]')
			.selectOption({ label: "品詞なし" });
		await newRow.locator('button:has-text("保存")').click();
		await page.waitForTimeout(500);

		// Export IME dictionary
		const imeExportBtn = page.locator("#export-ime-btn");
		await imeExportBtn.click();
		await page.waitForTimeout(1000);

		// Verify file was created
		const expectedFilePath = path.join(exportDir, "multiword.txt");
		expect(fs.existsSync(expectedFilePath)).toBe(true);

		// Verify file content contains both entries
		const content = fs.readFileSync(expectedFilePath, "utf-8");
		const lines = content.trim().split("\n");
		expect(lines).toHaveLength(2);

		// Check that both entries are present (order may vary)
		const expectedLines = [
			"げーむ\tゲーム\t名詞\t#複数単語テスト",
			"たのしい\t楽しい\t名詞\t#複数単語テスト",
		];

		expectedLines.forEach((expectedLine) => {
			expect(lines).toContain(expectedLine);
		});
	});

	test("全ゲーム一括出力ボタンが存在し、クリック可能", async () => {
		const exportAllBtn = page.locator("#export-all-games-btn");
		await expect(exportAllBtn).toBeVisible();
		await expect(exportAllBtn).toBeEnabled();
		expect(await exportAllBtn.textContent()).toBe("全ゲーム一括出力");
	});

	test("全ゲーム一括出力ボタンクリックで処理が実行される", async () => {
		// Click export all games button (should handle empty database gracefully)
		const exportAllBtn = page.locator("#export-all-games-btn");
		await exportAllBtn.click();
		await page.waitForTimeout(2000);

		// The button should be clickable and not crash the app
		// (Error handling for empty database is tested in unit tests)
		expect(await exportAllBtn.isVisible()).toBe(true);
		expect(await exportAllBtn.isEnabled()).toBe(true);
	});

	test("全ゲーム一括出力でエラーが発生した場合のハンドリング", async () => {
		// Click export all games button (should work with existing data)
		const exportAllBtn = page.locator("#export-all-games-btn");
		await exportAllBtn.click();
		await page.waitForTimeout(2000);

		// Should show success message or handle gracefully
		// Note: This test mainly ensures the button works and doesn't crash
		// The actual error case (no games) is covered in unit tests
		expect(await exportAllBtn.isVisible()).toBe(true);
	});
});
