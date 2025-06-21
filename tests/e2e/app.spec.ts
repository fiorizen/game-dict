import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Game Dictionary App', () => {
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
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('アプリが正常に起動する', async () => {
    // ウィンドウのタイトルを確認
    expect(await page.title()).toBe('IME辞書管理ツール');
    
    // メインアプリコンテナが表示されているか確認
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();
    
    // ヘッダーが表示されているか確認
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
  });

  test('ゲーム管理セクションが表示される', async () => {
    // ゲーム選択セクションが存在するか確認
    const gameSelector = page.locator('.game-selector');
    await expect(gameSelector).toBeVisible();
    
    // ゲーム選択のセレクトボックスが存在するか確認
    const gameSelect = page.locator('#game-select');
    await expect(gameSelect).toBeVisible();
    
    // 新しいゲーム追加ボタンが存在するか確認
    const addGameBtn = page.locator('#add-game-btn');
    await expect(addGameBtn).toBeVisible();
  });

  test('単語管理セクションが表示される', async () => {
    // 単語追加ボタンが存在するか確認
    const addEntryBtn = page.locator('#add-entry-btn');
    await expect(addEntryBtn).toBeVisible();
    
    // インライン編集テーブルコンテナが存在するか確認
    const entriesTableContainer = page.locator('#entries-table-container');
    await expect(entriesTableContainer).toBeVisible();
  });

  test('CSV管理セクションが表示される', async () => {
    // インポート・エクスポートボタンが存在するか確認
    const importBtn = page.locator('#import-csv-btn');
    const exportBtn = page.locator('#export-csv-btn');
    
    await expect(importBtn).toBeVisible();
    await expect(exportBtn).toBeVisible();
  });
});