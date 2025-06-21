import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Core Functionality Tests', () => {
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

  test('ElectronAPIが正常に利用可能', async () => {
    const hasElectronAPI = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    expect(hasElectronAPI).toBe(true);
  });

  test('ゲームAPI基本操作が動作する', async () => {
    // 初期ゲーム数取得
    const initialGames = await page.evaluate(async () => {
      return await (window as any).electronAPI.games.getAll();
    });

    // ゲーム作成
    const createResult = await page.evaluate(async () => {
      try {
        const result = await (window as any).electronAPI.games.create({ name: 'APIテストゲーム' });
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(createResult.success).toBe(true);

    // ゲーム一覧確認
    const updatedGames = await page.evaluate(async () => {
      return await (window as any).electronAPI.games.getAll();
    });

    expect(updatedGames.length).toBe(initialGames.length + 1);
    expect(updatedGames.some((game: any) => game.name === 'APIテストゲーム')).toBe(true);

    // 作成されたゲームの詳細取得
    const newGame = updatedGames.find((game: any) => game.name === 'APIテストゲーム');
    expect(newGame).toBeDefined();
    expect(newGame.id).toBeGreaterThan(0);
    expect(newGame.created_at).toBeDefined();
    expect(newGame.updated_at).toBeDefined();
  });

  test('カテゴリAPI基本操作が動作する', async () => {
    const categories = await page.evaluate(async () => {
      return await (window as any).electronAPI.categories.getAll();
    });

    // デフォルトカテゴリ数の確認
    expect(categories.length).toBe(3);
    
    // 新しいカテゴリが存在することを確認
    const categoryNames = categories.map((cat: any) => cat.name);
    expect(categoryNames).toContain('名詞');
    expect(categoryNames).toContain('品詞なし');
    expect(categoryNames).toContain('人名');
  });

  test('エントリAPI基本操作が動作する', async () => {
    // 全エントリ取得
    const allEntries = await page.evaluate(async () => {
      return await (window as any).electronAPI.entries.getAll();
    });

    expect(Array.isArray(allEntries)).toBe(true);
    console.log('総エントリ数:', allEntries.length);
  });

  test('データベース操作の一貫性', async () => {
    // 複数のAPI呼び出しが一貫して動作するかテスト
    const operations = await page.evaluate(async () => {
      try {
        const games = await (window as any).electronAPI.games.getAll();
        const categories = await (window as any).electronAPI.categories.getAll();
        const entries = await (window as any).electronAPI.entries.getAll();
        
        return {
          success: true,
          counts: {
            games: games.length,
            categories: categories.length,
            entries: entries.length
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(operations.success).toBe(true);
    expect(operations.counts.games).toBeGreaterThanOrEqual(0);
    expect(operations.counts.categories).toBeGreaterThan(0); // デフォルトカテゴリがある
    expect(operations.counts.entries).toBeGreaterThanOrEqual(0);

    console.log('データベース状況:', operations.counts);
  });
});