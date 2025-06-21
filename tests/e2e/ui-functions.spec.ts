import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('UI Functions E2E Tests', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      cwd: path.join(__dirname, '../..'),
    });
    
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    
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

  // Helper function to close all modals
  async function closeAllModals(page: any) {
    try {
      // Force close game modal using JavaScript
      await page.evaluate(() => {
        const gameModal = document.getElementById('game-modal');
        if (gameModal) {
          gameModal.style.display = 'none';
        }
      });
    } catch (e) {
      // Ignore if element doesn't exist
    }
    
    try {
      // Force close entry modal using JavaScript
      await page.evaluate(() => {
        const entryModal = document.getElementById('entry-modal');
        if (entryModal) {
          entryModal.style.display = 'none';
        }
      });
    } catch (e) {
      // Ignore if element doesn't exist
    }
    
    // Wait a moment for UI to settle
    await page.waitForTimeout(100);
  }

  test.describe('ゲーム追加機能', () => {
    test('ゲーム追加ボタンクリックでモーダルが開く', async () => {
      const addGameBtn = page.locator('#add-game-btn');
      await addGameBtn.click();
      
      const modal = page.locator('#game-modal');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('#game-modal-title');
      await expect(modalTitle).toHaveText('ゲーム追加');
    });

    test('ゲーム名を入力して保存できる', async () => {
      // モーダルを開く
      const addGameBtn = page.locator('#add-game-btn');
      await addGameBtn.click();
      
      // ゲーム名を入力
      const gameNameInput = page.locator('#game-name');
      await gameNameInput.fill('UIテストゲーム');
      
      // 保存ボタンをクリック
      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();
      
      // モーダルが閉じることを確認
      const modal = page.locator('#game-modal');
      await expect(modal).not.toBeVisible();
      
      // ゲーム選択リストに追加されることを確認（少し待機）
      await page.waitForTimeout(500);
      const gameSelect = page.locator('#game-select');
      await expect(gameSelect.locator('option').filter({ hasText: 'UIテストゲーム' })).toHaveCount(1);
    });

    test('キャンセルボタンでモーダルが閉じる', async () => {
      const addGameBtn = page.locator('#add-game-btn');
      await addGameBtn.click();
      
      const cancelBtn = page.locator('#cancel-game-btn');
      await cancelBtn.click();
      
      const modal = page.locator('#game-modal');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('単語追加機能', () => {
    test.beforeEach(async () => {
      // テスト用ゲームを追加
      const addGameBtn = page.locator('#add-game-btn');
      await addGameBtn.click();
      
      const gameNameInput = page.locator('#game-name');
      await gameNameInput.fill('単語エントリテストゲーム');
      
      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();
      
      // ゲームを選択（最後に追加されたオプション）
      const gameSelect = page.locator('#game-select');
      const lastOption = await gameSelect.locator('option').last().getAttribute('value');
      if (lastOption && lastOption !== '') {
        await gameSelect.selectOption(lastOption);
      }
    });

    test('ゲーム選択後に単語追加ボタンが有効になる', async () => {
      // Ensure a game is selected
      const gameSelect = page.locator('#game-select');
      const currentValue = await gameSelect.inputValue();
      
      if (!currentValue) {
        // Select first available game or create one
        const options = await gameSelect.locator('option').all();
        let selectedOption = false;
        
        for (const option of options) {
          const value = await option.getAttribute('value');
          if (value && value !== '') {
            await gameSelect.selectOption(value);
            selectedOption = true;
            break;
          }
        }
        
        if (!selectedOption) {
          // Create a test game
          const addGameBtn = page.locator('#add-game-btn');
          await addGameBtn.click();
          await page.locator('#game-name').fill('有効化テストゲーム');
          await page.locator('#game-form button[type="submit"]').click();
          await page.waitForTimeout(500);
        }
      }
      
      const addEntryBtn = page.locator('#add-entry-btn');
      await expect(addEntryBtn).toBeEnabled();
    });

    test('単語追加ボタンクリックでモーダルが開く（ゲーム選択済み前提）', async () => {
      // 既存のゲームを選択する（簡素化）
      const gameSelect = page.locator('#game-select');
      const options = await gameSelect.locator('option').all();
      
      // Find the first option with a non-empty value
      let gameSelected = false;
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await gameSelect.selectOption(value);
          gameSelected = true;
          break;
        }
      }
      
      // If no game available, create one
      if (!gameSelected) {
        const addGameBtn = page.locator('#add-game-btn');
        await addGameBtn.click();
        await page.locator('#game-name').fill('モーダルテストゲーム');
        await page.locator('#game-form button[type="submit"]').click();
        
        // Wait for modal to close and game to be created
        const modal = page.locator('#game-modal');
        await expect(modal).not.toBeVisible();
        
        // Force close modal using JavaScript to ensure it's gone
        await page.evaluate(() => {
          const gameModal = document.getElementById('game-modal');
          if (gameModal) {
            gameModal.style.display = 'none';
          }
        });
        
        await page.waitForTimeout(500);
      }
      
      // Double-check that no modals are interfering
      await closeAllModals(page);
      
      // Ensure button is enabled and clickable
      const addEntryBtn = page.locator('#add-entry-btn');
      await expect(addEntryBtn).toBeEnabled();
      await expect(addEntryBtn).toBeVisible();
      
      // Ensure no modals are blocking the button
      const gameModal = page.locator('#game-modal');
      await expect(gameModal).not.toBeVisible();
      
      // 単語追加ボタンクリック
      await addEntryBtn.click();
      
      // モーダルが開くことを確認
      const entryModal = page.locator('#entry-modal');
      await expect(entryModal).toBeVisible();
      
      const modalTitle = page.locator('#entry-modal-title');
      await expect(modalTitle).toHaveText('単語追加');
    });

    test('単語情報を入力して保存できる', async () => {
      // Ensure a game is selected
      const gameSelect = page.locator('#game-select');
      const currentValue = await gameSelect.inputValue();
      
      let gameSelected = false;
      if (currentValue) {
        gameSelected = true;
      } else {
        // Try to select an existing game first
        const options = await gameSelect.locator('option').all();
        
        for (const option of options) {
          const value = await option.getAttribute('value');
          if (value && value !== '') {
            await gameSelect.selectOption(value);
            gameSelected = true;
            break;
          }
        }
        
        // If no game available, create one with unique name
        if (!gameSelected) {
          const addGameBtn = page.locator('#add-game-btn');
          await addGameBtn.click();
          
          // Use timestamp to ensure unique game name
          const timestamp = Date.now();
          await page.locator('#game-name').fill(`保存テストゲーム${timestamp}`);
          await page.locator('#game-form button[type="submit"]').click();
          
          // Wait for modal to close and game to be created
          const modal = page.locator('#game-modal');
          await expect(modal).not.toBeVisible();
          
          // Force close modal using JavaScript to ensure it's gone
          await page.evaluate(() => {
            const gameModal = document.getElementById('game-modal');
            if (gameModal) {
              gameModal.style.display = 'none';
            }
          });
          
          await page.waitForTimeout(500);
          gameSelected = true;
        }
      }
      
      expect(gameSelected).toBe(true);
      
      // Double-check that no modals are interfering
      await closeAllModals(page);
      
      // Ensure button is enabled and clickable
      const addEntryBtn = page.locator('#add-entry-btn');
      await expect(addEntryBtn).toBeEnabled();
      await expect(addEntryBtn).toBeVisible();
      
      // Ensure no modals are blocking the button
      const gameModal = page.locator('#game-modal');
      await expect(gameModal).not.toBeVisible();
      
      // 単語追加モーダルを開く
      await addEntryBtn.click();
      
      // 各フィールドに入力
      await page.locator('#entry-reading').fill('てすと');
      await page.locator('#entry-word').fill('テスト');
      
      // カテゴリを選択（最初の有効なオプション）
      const categorySelect = page.locator('#entry-category');
      await page.waitForTimeout(200); // Wait for category options to load
      
      const categoryOptions = await categorySelect.locator('option').all();
      let categorySelected = false;
      
      // Find first non-empty category option (skip the first empty option)
      for (let i = 1; i < categoryOptions.length; i++) {
        const value = await categoryOptions[i].getAttribute('value');
        if (value && value !== '') {
          await categorySelect.selectOption(value);
          categorySelected = true;
          break;
        }
      }
      
      expect(categorySelected).toBe(true);
      
      await page.locator('#entry-description').fill('テスト用の単語');
      
      // 保存ボタンをクリック
      const saveBtn = page.locator('#entry-form button[type="submit"]');
      await saveBtn.click();
      
      // モーダルが閉じることを確認
      const entryModal = page.locator('#entry-modal');
      await expect(entryModal).not.toBeVisible();
      
      // 単語リストに追加されることを確認
      const entriesList = page.locator('#entries-list');
      await expect(entriesList.locator('.entry-item')).toHaveCount(1);
      await expect(entriesList.locator('.entry-reading')).toHaveText('てすと');
      await expect(entriesList.locator('.entry-word')).toHaveText('テスト');
    });
  });


});