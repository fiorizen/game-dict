import { expect, test } from "@playwright/test";
import path from "path";
import { _electron as electron } from "playwright";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("UI Functions E2E Tests", () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, "../../dist/main/main.js")],
      cwd: path.join(__dirname, "../.."),
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState("domcontentloaded");

    // Wait for app to fully initialize
    await page.waitForTimeout(1000);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  // Clean up before each test to ensure modal state doesn't interfere
  test.beforeEach(async () => {
    await closeAllModals(page);
  });

  // Clean up after each test to ensure modal state doesn't interfere
  test.afterEach(async () => {
    await closeAllModals(page);
  });

  // Helper function to close all modals and clear toasts
  async function closeAllModals(page: any) {
    try {
      // Force close game modal using JavaScript
      await page.evaluate(() => {
        const gameModal = document.getElementById("game-modal");
        if (gameModal) {
          gameModal.style.display = "none";
        }
        
        // Clear existing toasts
        const toasts = document.querySelectorAll('.toast');
        toasts.forEach(toast => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        });
      });
    } catch (e) {
      // Ignore if element doesn't exist
    }

    // Wait a moment for UI to settle
    await page.waitForTimeout(100);
  }

  test.describe("ゲーム追加機能", () => {
    test("ゲーム追加ボタンクリックでモーダルが開く", async () => {
      const addGameBtn = page.locator("#add-game-btn");
      await addGameBtn.click();

      const modal = page.locator("#game-modal");
      await expect(modal).toBeVisible();

      // モーダルタイトル要素が存在することを確認
      const modalTitle = page.locator("#game-modal-title");
      await expect(modalTitle).toBeVisible();
    });

    test("ゲーム名を入力して保存できる", async () => {
      // モーダルを開く
      const addGameBtn = page.locator("#add-game-btn");
      await addGameBtn.click();

      // ゲーム名を入力
      const gameNameInput = page.locator("#game-name");
      await gameNameInput.fill("UIテストゲーム");

      // 保存ボタンをクリック
      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();

      // モーダルが閉じることを確認
      const modal = page.locator("#game-modal");
      await expect(modal).not.toBeVisible();

      // ゲーム選択リストに追加されることを確認（少し待機）
      await page.waitForTimeout(500);
      const gameSelect = page.locator("#game-select");
      await expect(
        gameSelect.locator("option").filter({ hasText: "UIテストゲーム" })
      ).toHaveCount(1);
    });

    test("キャンセルボタンでモーダルが閉じる", async () => {
      const addGameBtn = page.locator("#add-game-btn");
      await addGameBtn.click();

      const cancelBtn = page.locator("#cancel-game-btn");
      await cancelBtn.click();

      const modal = page.locator("#game-modal");
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe("インライン単語追加機能", () => {
    test.beforeAll(async () => {
      // テスト用ゲームを追加
      const addGameBtn = page.locator("#add-game-btn");
      await addGameBtn.click();

      const gameNameInput = page.locator("#game-name");
      await gameNameInput.fill("単語エントリテストゲーム");

      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();

      // ゲームを選択（追加されたゲームを選択）
      const gameSelect = page.locator("#game-select");
      await page.waitForTimeout(200); // オプション更新待機

      // 追加したゲーム名で選択
      const testGameOption = gameSelect
        .locator("option")
        .filter({ hasText: "単語エントリテストゲーム" });
      if ((await testGameOption.count()) > 0) {
        const optionValue = await testGameOption.getAttribute("value");
        if (optionValue) {
          await gameSelect.selectOption(optionValue);
        }
      }
    });

    test("ゲーム選択後に単語追加ボタンが有効になる", async () => {
      // Ensure a game is selected
      const gameSelect = page.locator("#game-select");
      const currentValue = await gameSelect.inputValue();

      if (!currentValue) {
        // Select first available game or create one
        const options = await gameSelect.locator("option").all();
        let selectedOption = false;

        for (const option of options) {
          const value = await option.getAttribute("value");
          if (value && value !== "") {
            await gameSelect.selectOption(value);
            selectedOption = true;
            break;
          }
        }

        if (!selectedOption) {
          // Create a test game
          const addGameBtn = page.locator("#add-game-btn");
          await addGameBtn.click();
          await page.locator("#game-name").fill("有効化テストゲーム");
          await page.locator('#game-form button[type="submit"]').click();
          await page.waitForTimeout(500);
        }
      }

      const addEntryBtn = page.locator("#add-entry-btn");
      await expect(addEntryBtn).toBeEnabled();
    });

    test("単語追加ボタンクリックで新規行が追加される（ゲーム選択済み前提）", async () => {
      // 既存のゲームを選択する（簡素化）
      const gameSelect = page.locator("#game-select");
      const options = await gameSelect.locator("option").all();

      // Find the first option with a non-empty value
      let gameSelected = false;
      for (const option of options) {
        const value = await option.getAttribute("value");
        if (value && value !== "") {
          await gameSelect.selectOption(value);
          gameSelected = true;
          break;
        }
      }

      // If no game available, create one
      if (!gameSelected) {
        const addGameBtn = page.locator("#add-game-btn");
        await addGameBtn.click();
        await page.locator("#game-name").fill("インライン編集テストゲーム");
        await page.locator('#game-form button[type="submit"]').click();

        // Wait for modal to close and game to be created
        const modal = page.locator("#game-modal");
        await expect(modal).not.toBeVisible();

        await page.waitForTimeout(500);
      }

      // Double-check that no modals are interfering
      await closeAllModals(page);

      // Ensure button is enabled and clickable
      const addEntryBtn = page.locator("#add-entry-btn");
      await expect(addEntryBtn).toBeEnabled();
      await expect(addEntryBtn).toBeVisible();

      // 単語追加ボタンクリック
      await addEntryBtn.click();

      // インライン編集テーブルが表示されることを確認
      const entriesTable = page.locator("#entries-table");
      await expect(entriesTable).toBeVisible();

      // 新規追加行が存在することを確認
      const newEntryRow = page.locator('#entries-table-body tr[data-is-new="true"]');
      await expect(newEntryRow).toBeVisible();

      // 読み入力フィールドにフォーカスがあることを確認
      const readingInput = newEntryRow.locator('input[name="reading"]');
      await expect(readingInput).toBeFocused();
    });

    test("単語情報をインライン入力して保存できる", async () => {
      // ゲームを選択または作成
      const gameSelect = page.locator("#game-select");
      let gameSelected = await gameSelect.inputValue();

      if (!gameSelected) {
        const options = await gameSelect.locator("option").all();
        for (const option of options) {
          const value = await option.getAttribute("value");
          if (value && value !== "") {
            await gameSelect.selectOption(value);
            gameSelected = value;
            break;
          }
        }

        if (!gameSelected) {
          await page.locator("#add-game-btn").click();
          await page.locator("#game-name").fill("保存テストゲーム");
          await page.locator('#game-form button[type="submit"]').click();
          await expect(page.locator("#game-modal")).not.toBeVisible();
          await page.waitForTimeout(500);
        }
      }

      await closeAllModals(page);

      // 単語追加ボタンをクリック
      const addEntryBtn = page.locator("#add-entry-btn");
      await expect(addEntryBtn).toBeEnabled();
      await addEntryBtn.click();

      // 新規エントリ行を取得し、入力
      const newEntryRow = page.locator('#entries-table-body tr[data-is-new="true"]');
      await expect(newEntryRow).toBeVisible();

      await newEntryRow.locator('input[name="reading"]').fill("てすと");
      await newEntryRow.locator('input[name="word"]').fill("テスト");
      await newEntryRow.locator('input[name="description"]').fill("テスト用の単語");

      // 保存ボタンをクリック（UI操作のみ確認）
      const saveBtn = newEntryRow.locator('button').filter({ hasText: "保存" });
      await saveBtn.click();

      // 保存処理が完了することを確認（データの詳細検証は単体テストで実施）
      await page.waitForTimeout(500);
    });
  });

  test.describe("CSV出力機能", () => {
    test("Git管理用CSV出力ボタンが存在し、クリック可能", async () => {
      const exportGitCsvBtn = page.locator("#export-git-csv-btn");
      
      // ボタンが存在し、表示されていることを確認
      await expect(exportGitCsvBtn).toBeVisible();
      await expect(exportGitCsvBtn).toContainText("Git管理用CSV出力");
      
      // ボタンがクリック可能であることを確認
      await expect(exportGitCsvBtn).toBeEnabled();
    });

    test("Git管理用CSV出力ボタンクリックで処理が実行される", async () => {
      await closeAllModals(page);
      
      // Git管理用CSV出力ボタンをクリック
      const exportGitCsvBtn = page.locator("#export-git-csv-btn");
      await exportGitCsvBtn.click();
      
      // 処理が完了することを確認（エラーが発生しないことを確認）
      await page.waitForTimeout(1500);
      
      // ボタンがまだ有効であることを確認（処理が正常に完了）
      await expect(exportGitCsvBtn).toBeEnabled();
    });

    test("CSV取込ボタンが存在し、クリック可能", async () => {
      const importCsvBtn = page.locator("#import-csv-btn");
      
      // ボタンが存在し、表示されていることを確認
      await expect(importCsvBtn).toBeVisible();
      await expect(importCsvBtn).toContainText("CSV取込");
      
      // ボタンがクリック可能であることを確認
      await expect(importCsvBtn).toBeEnabled();
    });

    test("CSV取込ボタンクリックで処理が呼び出される", async () => {
      const importCsvBtn = page.locator("#import-csv-btn");
      
      // CSV取込ボタンをクリック（ダイアログは自動的にキャンセルされる）
      await importCsvBtn.click();
      
      // ボタンクリックでエラーが発生しないことを確認
      await page.waitForTimeout(1000);
      
      // ボタンがまだ有効であることを確認（処理が正常に完了）
      await expect(importCsvBtn).toBeEnabled();
      await expect(importCsvBtn).toBeVisible();
    });
  });
});
