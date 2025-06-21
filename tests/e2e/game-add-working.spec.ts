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
    // 1. 初期状態確認
    const initialGames = await page.evaluate(async () => {
      return await (window as any).electronAPI.games.getAll();
    });
    console.log('初期ゲーム数:', initialGames.length);

    // 2. ゲーム追加ボタンをクリック
    const addGameBtn = page.locator('#add-game-btn');
    await addGameBtn.click();
    
    // 3. モーダルが開くことを確認
    const modal = page.locator('#game-modal');
    await expect(modal).toBeVisible();

    // 4. ゲーム名を入力
    const gameNameInput = page.locator('#game-name');
    await gameNameInput.fill('ワーキングテストゲーム');

    // 5. 保存ボタンをクリック
    const saveBtn = page.locator('#game-form button[type="submit"]');
    await saveBtn.click();

    // 6. モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    // 7. ゲームが追加されたことをAPI経由で確認
    await page.waitForTimeout(500); // 少し待機

    const newGames = await page.evaluate(async () => {
      return await (window as any).electronAPI.games.getAll();
    });

    console.log('追加後ゲーム数:', newGames.length);
    console.log('追加されたゲーム:', newGames);

    // Expect at least one more game than initial (allowing for parallel test execution)
    expect(newGames.length).toBeGreaterThanOrEqual(initialGames.length + 1);
    expect(newGames.some((game: any) => game.name === 'ワーキングテストゲーム')).toBe(true);

    // 8. ゲーム選択リストに反映されることを確認
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

    // 全ゲームがAPI経由で確認できることを検証
    const allGames = await page.evaluate(async () => {
      return await (window as any).electronAPI.games.getAll();
    });

    console.log('全ゲーム:', allGames.map((g: any) => g.name));

    for (const gameName of gameNames) {
      expect(allGames.some((game: any) => game.name === gameName)).toBe(true);
    }

    // 選択リストにも反映されていることを確認
    for (const gameName of gameNames) {
      await expect(page.locator('#game-select').locator('option').filter({ hasText: gameName })).toHaveCount(1);
    }
  });
});