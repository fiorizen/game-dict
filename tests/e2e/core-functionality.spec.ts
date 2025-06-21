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
    // ゲーム作成APIが正常に呼び出せることを確認
    const createResult = await page.evaluate(async () => {
      try {
        await (window as any).electronAPI.games.create({ name: 'APIテストゲーム' });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(createResult.success).toBe(true);

    // ゲーム一覧取得APIが正常に呼び出せることを確認
    const getAllResult = await page.evaluate(async () => {
      try {
        const games = await (window as any).electronAPI.games.getAll();
        return { success: true, hasData: Array.isArray(games) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(getAllResult.success).toBe(true);
    expect(getAllResult.hasData).toBe(true);
  });

  test('カテゴリAPI基本操作が動作する', async () => {
    const categoriesResult = await page.evaluate(async () => {
      try {
        const categories = await (window as any).electronAPI.categories.getAll();
        return { success: true, hasData: Array.isArray(categories) && categories.length > 0 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(categoriesResult.success).toBe(true);
    expect(categoriesResult.hasData).toBe(true);
  });

  test('エントリAPI基本操作が動作する', async () => {
    const entriesResult = await page.evaluate(async () => {
      try {
        const entries = await (window as any).electronAPI.entries.getAll();
        return { success: true, isArray: Array.isArray(entries) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(entriesResult.success).toBe(true);
    expect(entriesResult.isArray).toBe(true);
  });

  test('データベース操作の一貫性', async () => {
    // 複数のAPI呼び出しが連続して動作することを確認
    const operations = await page.evaluate(async () => {
      try {
        await (window as any).electronAPI.games.getAll();
        await (window as any).electronAPI.categories.getAll();
        await (window as any).electronAPI.entries.getAll();
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(operations.success).toBe(true);
  });
});