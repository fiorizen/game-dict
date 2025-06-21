import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Game Add Functionality', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      cwd: path.join(__dirname, '../..'),
    });
    
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('ゲーム追加が完全に動作する', async () => {
    // ゲーム追加ボタンをクリック
    const addGameBtn = page.locator('#add-game-btn');
    await addGameBtn.click();
    
    // モーダルが開くことを確認
    const modal = page.locator('#game-modal');
    await expect(modal).toBeVisible();

    // ゲーム名を入力
    const gameNameInput = page.locator('#game-name');
    await gameNameInput.fill('ワーキングテストゲーム');

    // 保存ボタンをクリック
    const saveBtn = page.locator('#game-form button[type="submit"]');
    await saveBtn.click();

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    // ゲーム選択リストに反映されることを確認
    await page.waitForTimeout(500);
    const gameSelect = page.locator('#game-select');
    await expect(gameSelect.locator('option').filter({ hasText: 'ワーキングテストゲーム' })).toHaveCount(1);
  });

  test('複数のゲームを追加できる', async () => {
    const gameNames = ['RPGゲーム', 'アクションゲーム', 'シミュレーションゲーム'];
    
    for (const gameName of gameNames) {
      // ゲーム追加プロセス
      await page.locator('#add-game-btn').click();
      await page.locator('#game-name').fill(gameName);
      await page.locator('#game-form button[type="submit"]').click();
      
      // モーダルが閉じることを確認
      await expect(page.locator('#game-modal')).not.toBeVisible();
      await page.waitForTimeout(300);
    }

    // UI上の選択リストに反映されていることを確認
    for (const gameName of gameNames) {
      await expect(page.locator('#game-select').locator('option').filter({ hasText: gameName })).toHaveCount(1);
    }
  });
});