import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Debug Preload', () => {
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

  test('プリロードスクリプトの詳細確認', async () => {
    // windowオブジェクトの中身を詳細確認
    const windowProps = await page.evaluate(() => {
      return {
        hasElectronAPI: 'electronAPI' in window,
        windowKeys: Object.keys(window).filter(key => key.includes('electron') || key.includes('API')),
        windowElectronAPI: typeof (window as any).electronAPI,
        process: typeof (window as any).process,
        require: typeof (window as any).require,
        contextIsolation: true // should be true
      };
    });
    
    console.log('Window properties:', windowProps);
    
    // webContentsの情報を確認
    const webContentsInfo = await electronApp.evaluate(({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const window = windows[0];
        return {
          webPreferences: window.webContents.getWebPreferences(),
          url: window.webContents.getURL(),
          title: window.webContents.getTitle()
        };
      }
      return null;
    });
    
    console.log('WebContents info:', webContentsInfo);
    
    // プリロードスクリプトが実行されているかイベントで確認
    const preloadExecuted = await page.evaluate(() => {
      return new Promise((resolve) => {
        // 少し待ってからチェック
        setTimeout(() => {
          resolve({
            electronAPI: typeof (window as any).electronAPI,
            contextBridge: typeof (window as any).contextBridge,
            electronExists: 'electronAPI' in window
          });
        }, 500);
      });
    });
    
    console.log('Preload execution check:', preloadExecuted);
  });
});