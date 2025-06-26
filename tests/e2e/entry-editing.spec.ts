import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ElectronApplication, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { _electron as electron } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Entry Editing E2E Tests", () => {
	let electronApp: ElectronApplication;
	let page: Page;

	test.beforeAll(async () => {
		electronApp = await electron.launch({
			args: [path.join(__dirname, "../../dist/main/main.js")],
			cwd: path.join(__dirname, "../.."),
		});

		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1000);
	});

	test.afterAll(async () => {
		if (electronApp) {
			await electronApp.close();
		}
	});

	test.beforeEach(async () => {
		await closeAllModals(page);
	});

	test.afterEach(async () => {
		await closeAllModals(page);
	});

	async function closeAllModals(page: Page) {
		try {
			await page.evaluate(() => {
				const gameModal = document.getElementById("game-modal");
				if (gameModal) {
					gameModal.style.display = "none";
				}
				
				// Also clear any other modal states
				const deleteGameModal = document.getElementById("delete-game-modal");
				if (deleteGameModal) {
					deleteGameModal.style.display = "none";
				}
			});
			await page.waitForTimeout(100);
		} catch (error) {
			// Ignore errors for modal cleanup
		}
	}

	async function setupTestGame(page: Page) {
		// Create a test game first
		const addGameBtn = page.locator("#add-game-btn");
		await addGameBtn.click();
		await page.waitForTimeout(200);

		const gameNameInput = page.locator("#game-name");
		await gameNameInput.fill("編集テストゲーム");

		const gameCodeInput = page.locator("#game-code");
		await gameCodeInput.fill("editingtest");

		const saveBtn = page.locator('#game-form button[type="submit"]');
		await saveBtn.click();
		
		// Wait for modal to close
		const modal = page.locator("#game-modal");
		await expect(modal).not.toBeVisible();
		await page.waitForTimeout(300);

		// Select the created game
		const gameSelect = page.locator("#game-select");
		await gameSelect.selectOption({ label: "編集テストゲーム" });
		await page.waitForTimeout(500);

		return "editingtest";
	}

	async function addTestEntry(page: Page) {
		// Add a test entry
		const addEntryBtn = page.locator("#add-entry-btn");
		await addEntryBtn.click();
		await page.waitForTimeout(200);

		// Fill in the new entry row
		const readingInput = page.locator("tr.new-entry input[name='reading']");
		await readingInput.fill("てすと");

		const wordInput = page.locator("tr.new-entry input[name='word']");
		await wordInput.fill("テスト");

		const categorySelect = page.locator("tr.new-entry select[name='category']");
		await categorySelect.selectOption({ index: 1 }); // Select first available category

		const descriptionInput = page.locator("tr.new-entry input[name='description']");
		await descriptionInput.fill("テスト用の単語");

		const saveBtn = page.locator("tr.new-entry button:has-text('保存')");
		await saveBtn.click();
		await page.waitForTimeout(500);
	}

	test("編集ボタンが存在し、クリック可能である", async () => {
		await setupTestGame(page);
		await addTestEntry(page);

		// Check that edit button exists
		const editBtn = page.locator("button:has-text('編集')").first();
		await expect(editBtn).toBeVisible();
		await expect(editBtn).toBeEnabled();
	});

	test("編集ボタンクリックで編集モードに切り替わる", async () => {
		await setupTestGame(page);
		await addTestEntry(page);

		// Click edit button
		const editBtn = page.locator("button:has-text('編集')").first();
		await editBtn.click();
		await page.waitForTimeout(300);

		// Check that the row is now in editing mode
		const editingRow = page.locator("tr.editing");
		await expect(editingRow).toBeVisible();

		// Check that input fields are visible
		const readingInput = editingRow.locator("input[name='reading']");
		const wordInput = editingRow.locator("input[name='word']");
		const categorySelect = editingRow.locator("select[name='category']");
		const descriptionInput = editingRow.locator("input[name='description']");

		await expect(readingInput).toBeVisible();
		await expect(wordInput).toBeVisible();
		await expect(categorySelect).toBeVisible();
		await expect(descriptionInput).toBeVisible();

		// Check that save and cancel buttons are visible
		const saveBtn = editingRow.locator("button:has-text('保存')");
		const cancelBtn = editingRow.locator("button:has-text('キャンセル')");

		await expect(saveBtn).toBeVisible();
		await expect(cancelBtn).toBeVisible();
	});

	test("編集モードで値を変更して保存できる", async () => {
		await setupTestGame(page);
		await addTestEntry(page);

		// Click edit button
		const editBtn = page.locator("button:has-text('編集')").first();
		await editBtn.click();
		await page.waitForTimeout(300);

		// Modify the entry
		const editingRow = page.locator("tr.editing");
		const wordInput = editingRow.locator("input[name='word']");
		await wordInput.fill("編集済みテスト");

		const descriptionInput = editingRow.locator("input[name='description']");
		await descriptionInput.fill("編集後の説明");

		// Save changes
		const saveBtn = editingRow.locator("button:has-text('保存')");
		await saveBtn.click();
		await page.waitForTimeout(500);

		// Check that editing mode is exited
		const editingRowAfter = page.locator("tr.editing");
		await expect(editingRowAfter).toHaveCount(0);

		// Check that changes are reflected
		const entryRow = page.locator("#entries-table tbody tr").first();
		await expect(entryRow).toContainText("編集済みテスト");
		await expect(entryRow).toContainText("編集後の説明");
	});

	test("編集モードでキャンセルできる", async () => {
		await setupTestGame(page);
		await addTestEntry(page);

		// Get original values
		const entryRow = page.locator("#entries-table tbody tr").first();
		const originalText = await entryRow.textContent();

		// Click edit button
		const editBtn = page.locator("button:has-text('編集')").first();
		await editBtn.click();
		await page.waitForTimeout(300);

		// Modify the entry
		const editingRow = page.locator("tr.editing");
		const wordInput = editingRow.locator("input[name='word']");
		await wordInput.fill("変更されるべきでない");

		// Cancel changes
		const cancelBtn = editingRow.locator("button:has-text('キャンセル')");
		await cancelBtn.click();
		await page.waitForTimeout(300);

		// Check that editing mode is exited
		const editingRowAfter = page.locator("tr.editing");
		await expect(editingRowAfter).toHaveCount(0);

		// Check that original values are preserved
		const entryRowAfter = page.locator("#entries-table tbody tr").first();
		const afterText = await entryRowAfter.textContent();
		expect(afterText).toBe(originalText);
	});

	test("編集中にバリデーションエラーが表示される", async () => {
		await setupTestGame(page);
		await addTestEntry(page);

		// Click edit button
		const editBtn = page.locator("button:has-text('編集')").first();
		await editBtn.click();
		await page.waitForTimeout(300);

		// Clear required fields
		const editingRow = page.locator("tr.editing");
		const readingInput = editingRow.locator("input[name='reading']");
		const wordInput = editingRow.locator("input[name='word']");

		await readingInput.fill("");
		await wordInput.fill("");

		// Try to save
		const saveBtn = editingRow.locator("button:has-text('保存')");
		await saveBtn.click();
		await page.waitForTimeout(300);

		// Check that we're still in editing mode (validation failed)
		const editingRowAfter = page.locator("tr.editing");
		await expect(editingRowAfter).toBeVisible();

		// Check that error styling is applied
		await expect(readingInput).toHaveClass(/error/);
		await expect(wordInput).toHaveClass(/error/);
	});

	test("JavaScript関数が正しく定義されている", async () => {
		// Check that all required functions are defined in the global scope
		const functionsExist = await page.evaluate(() => {
			return {
				editEntryInline: typeof globalThis.editEntryInline === "function",
				saveEditedEntry: typeof globalThis.saveEditedEntry === "function",
				cancelEditEntry: typeof globalThis.cancelEditEntry === "function",
				saveNewEntry: typeof globalThis.saveNewEntry === "function",
				clearNewEntry: typeof globalThis.clearNewEntry === "function",
			};
		});

		expect(functionsExist.editEntryInline).toBe(true);
		expect(functionsExist.saveEditedEntry).toBe(true);
		expect(functionsExist.cancelEditEntry).toBe(true);
		expect(functionsExist.saveNewEntry).toBe(true);
		expect(functionsExist.clearNewEntry).toBe(true);
	});

	test("JavaScriptエラーが発生しないことを確認", async () => {
		const errors: string[] = [];

		// Listen for console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});

		// Listen for page errors
		page.on("pageerror", (error) => {
			errors.push(error.message);
		});

		await setupTestGame(page);
		await addTestEntry(page);

		// Click edit button
		const editBtn = page.locator("button:has-text('編集')").first();
		await editBtn.click();
		await page.waitForTimeout(300);

		// Cancel editing
		const editingRow = page.locator("tr.editing");
		const cancelBtn = editingRow.locator("button:has-text('キャンセル')");
		await cancelBtn.click();
		await page.waitForTimeout(300);

		// Check that no JavaScript errors occurred
		expect(errors).toHaveLength(0);
	});
});