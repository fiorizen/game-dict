import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Debug Game Add', () => {
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

  test('デバッグ：ゲーム追加の詳細動作確認', async () => {
    // コンソールログを監視
    page.on('console', (msg: any) => {
      console.log(`PAGE LOG: ${msg.text()}`);
    });
    
    // エラーを監視
    page.on('pageerror', (error: any) => {
      console.error(`PAGE ERROR: ${error.message}`);
    });

    // 1. electronAPI の確認
    const hasElectronAPI = await page.evaluate(() => {
      return typeof window.electronAPI !== 'undefined';
    });
    console.log('Has electronAPI:', hasElectronAPI);

    // 2. ゲーム追加ボタンをクリック
    console.log('クリック前の状態確認...');
    const addGameBtn = page.locator('#add-game-btn');
    await addGameBtn.click();
    
    // 3. モーダルが開いたか確認
    const modal = page.locator('#game-modal');
    await expect(modal).toBeVisible();
    console.log('モーダル表示確認完了');

    // 4. ゲーム名を入力
    const gameNameInput = page.locator('#game-name');
    await gameNameInput.fill('デバッグテストゲーム');
    console.log('ゲーム名入力完了');

    // 5. 保存ボタンの存在確認
    const saveBtn = page.locator('#game-form button[type="submit"]');
    await expect(saveBtn).toBeVisible();
    console.log('保存ボタン確認完了');

    // 6. フォーム送信処理を詳細に確認
    console.log('保存ボタンクリック前...');
    
    // JavaScriptでの直接実行でテスト
    const testResult = await page.evaluate(async () => {
      try {
        // electronAPI が利用可能か確認
        if (!window.electronAPI) {
          return { error: 'electronAPI not available' };
        }
        
        // ゲーム作成APIを直接呼び出し
        const result = await window.electronAPI.games.create({ name: 'デバッグテストゲーム2' });
        return { success: true, result };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('JavaScript実行結果:', testResult);
    
    // 7. フォーム送信
    await saveBtn.click();
    console.log('保存ボタンクリック完了');
    
    // 8. 少し待機してモーダルの状態確認
    await page.waitForTimeout(2000);
    
    const modalVisible = await modal.isVisible();
    console.log('保存後のモーダル表示状態:', modalVisible);
    
    // 9. コンソールエラーがないか確認
    const logs = await page.evaluate(() => {
      return console.toString();
    });
  });
});