import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Simple App Test', () => {
  test('アプリが起動してelectronAPIが利用可能', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      cwd: path.join(__dirname, '../..'),
    });
    
    const page = await electronApp.firstWindow();
    
    // 基本的な読み込み待機
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // electronAPIが利用可能か確認
    const hasElectronAPI = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    console.log('Has electronAPI:', hasElectronAPI);
    
    // 簡単なAPI呼び出しテスト
    if (hasElectronAPI) {
      const gamesResult = await page.evaluate(async () => {
        try {
          const games = await (window as any).electronAPI.games.getAll();
          return { success: true, games };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('Games API result:', gamesResult);
      expect(gamesResult.success).toBe(true);
    }
    
    expect(hasElectronAPI).toBe(true);
    
    await electronApp.close();
  });
});