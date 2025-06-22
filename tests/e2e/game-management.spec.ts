import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Game Management Features', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    // Electronアプリを起動
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      cwd: path.join(__dirname, '../..'),
    });
    
    // 最初のウィンドウを取得
    page = await electronApp.firstWindow();
    
    // ウィンドウが読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Additional wait for initialization
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('ゲーム追加・編集・削除の一連の流れ', async () => {
    // Test game creation
    const addGameBtn = page.locator('#add-game-btn');
    await expect(addGameBtn).toBeVisible();
    await addGameBtn.click();

    const gameModal = page.locator('#game-modal');
    await expect(gameModal).toBeVisible();

    const nameInput = page.locator('#game-name');
    const codeInput = page.locator('#game-code');
    
    await nameInput.fill('Test Edit Game');
    await codeInput.fill('testeditgame');

    const submitBtn = page.locator('#game-form button[type="submit"]');
    await submitBtn.click();

    // Wait for modal to close and game to be created
    await expect(gameModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify game was created and selected
    const gameSelect = page.locator('#game-select');
    const selectedOption = await gameSelect.inputValue();
    expect(selectedOption).not.toBe('');

    // Verify edit and delete buttons are enabled
    const editGameBtn = page.locator('#edit-game-btn');
    const deleteGameBtn = page.locator('#delete-game-btn');
    
    await expect(editGameBtn).toBeEnabled();
    await expect(deleteGameBtn).toBeEnabled();

    // Test game editing
    await editGameBtn.click();
    await expect(gameModal).toBeVisible();

    // Verify modal is in edit mode
    const modalTitle = page.locator('#game-modal-title');
    await expect(modalTitle).toHaveText('ゲーム編集');

    // Edit the game
    await nameInput.fill('Test Edit Game Updated');
    await codeInput.fill('testeditgameupd');
    await submitBtn.click();

    // Wait for modal to close
    await expect(gameModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify the game title was updated
    const currentGameTitle = page.locator('#current-game-title');
    await expect(currentGameTitle).toHaveText('Test Edit Game Updated');

    // Test game deletion
    await deleteGameBtn.click();

    const deleteModal = page.locator('#delete-game-modal');
    await expect(deleteModal).toBeVisible();

    // Verify warning information
    const gameNameSpan = page.locator('#delete-game-name');
    await expect(gameNameSpan).toHaveText('Test Edit Game Updated');

    // Confirm deletion
    const confirmDeleteBtn = page.locator('#confirm-delete-game-btn');
    await confirmDeleteBtn.click();

    // Wait for deletion to complete
    await expect(deleteModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify game was deleted (select should be reset)
    const selectedAfterDelete = await gameSelect.inputValue();
    expect(selectedAfterDelete).toBe('');

    // Verify buttons are disabled again
    await expect(editGameBtn).toBeDisabled();
    await expect(deleteGameBtn).toBeDisabled();
  });

  test('ゲーム削除時のエントリー警告表示', async () => {
    // Create a game with entries
    const addGameBtn = page.locator('#add-game-btn');
    await addGameBtn.click();

    const gameModal = page.locator('#game-modal');
    await expect(gameModal).toBeVisible();

    const nameInput = page.locator('#game-name');
    const codeInput = page.locator('#game-code');
    
    await nameInput.fill('Game With Entries');
    await codeInput.fill('gamewithentries');

    const submitBtn = page.locator('#game-form button[type="submit"]');
    await submitBtn.click();

    await expect(gameModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Add an entry to this game
    const addEntryBtn = page.locator('#add-entry-btn');
    await expect(addEntryBtn).toBeEnabled();
    await addEntryBtn.click();

    // Wait for new entry row to appear
    await page.waitForTimeout(500);

    // Fill in the entry
    const readingInput = page.locator('input[data-field="reading"]:last-of-type');
    const wordInput = page.locator('input[data-field="word"]:last-of-type');
    
    await readingInput.fill('てすと');
    await wordInput.fill('テスト');
    
    // Click outside to trigger save
    await page.locator('body').click();
    await page.waitForTimeout(1000);

    // Try to delete the game
    const deleteGameBtn = page.locator('#delete-game-btn');
    await deleteGameBtn.click();

    const deleteModal = page.locator('#delete-game-modal');
    await expect(deleteModal).toBeVisible();

    // Verify entries count is displayed
    const entriesCountSpan = page.locator('#delete-entries-count');
    await expect(entriesCountSpan).toHaveText('1');

    const entriesMessage = page.locator('#delete-entries-message');
    await expect(entriesMessage).toBeVisible();

    // Cancel deletion
    const cancelBtn = page.locator('#cancel-delete-game-btn');
    await cancelBtn.click();

    await expect(deleteModal).not.toBeVisible();

    // Verify game still exists
    const gameSelect = page.locator('#game-select');
    const selectedOption = await gameSelect.inputValue();
    expect(selectedOption).not.toBe('');
  });

  test('編集時のコード重複検証', async () => {
    // Create first game
    const addGameBtn = page.locator('#add-game-btn');
    await addGameBtn.click();

    const gameModal = page.locator('#game-modal');
    const nameInput = page.locator('#game-name');
    const codeInput = page.locator('#game-code');
    
    await nameInput.fill('First Game');
    await codeInput.fill('firstgame');

    const submitBtn = page.locator('#game-form button[type="submit"]');
    await submitBtn.click();
    await expect(gameModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Create second game
    await addGameBtn.click();
    await expect(gameModal).toBeVisible();
    
    await nameInput.fill('Second Game');
    await codeInput.fill('secondgame');
    await submitBtn.click();
    await expect(gameModal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Try to edit second game with first game's code
    const editGameBtn = page.locator('#edit-game-btn');
    await editGameBtn.click();
    await expect(gameModal).toBeVisible();

    await codeInput.fill('firstgame'); // Duplicate code
    await submitBtn.click();

    // Should show error toast (modal should remain open)
    await expect(gameModal).toBeVisible();
    
    // Cancel the edit
    const cancelBtn = page.locator('#cancel-game-btn');
    await cancelBtn.click();
    await expect(gameModal).not.toBeVisible();
  });
});