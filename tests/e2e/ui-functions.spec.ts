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
      await gameNameInput.fill('テストゲーム');
      
      // 保存ボタンをクリック
      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();
      
      // モーダルが閉じることを確認
      const modal = page.locator('#game-modal');
      await expect(modal).not.toBeVisible();
      
      // ゲーム選択リストに追加されることを確認（少し待機）
      await page.waitForTimeout(500);
      const gameSelect = page.locator('#game-select');
      await expect(gameSelect.locator('option').last()).toContainText('テストゲーム');
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
      await gameNameInput.fill('単語テストゲーム');
      
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
      const addEntryBtn = page.locator('#add-entry-btn');
      await expect(addEntryBtn).toBeEnabled();
    });

    test('単語追加ボタンクリックでモーダルが開く', async () => {
      const addEntryBtn = page.locator('#add-entry-btn');
      await addEntryBtn.click();
      
      const modal = page.locator('#entry-modal');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('#entry-modal-title');
      await expect(modalTitle).toHaveText('単語追加');
    });

    test('単語情報を入力して保存できる', async () => {
      // 単語追加モーダルを開く
      const addEntryBtn = page.locator('#add-entry-btn');
      await addEntryBtn.click();
      
      // 各フィールドに入力
      await page.locator('#entry-reading').fill('てすと');
      await page.locator('#entry-word').fill('テスト');
      
      // カテゴリを選択（最初の有効なオプション）
      const categorySelect = page.locator('#entry-category');
      const firstCategoryOption = await categorySelect.locator('option').nth(1).getAttribute('value');
      if (firstCategoryOption) {
        await categorySelect.selectOption(firstCategoryOption);
      }
      
      await page.locator('#entry-description').fill('テスト用の単語');
      
      // 保存ボタンをクリック
      const saveBtn = page.locator('#entry-form button[type="submit"]');
      await saveBtn.click();
      
      // モーダルが閉じることを確認
      const modal = page.locator('#entry-modal');
      await expect(modal).not.toBeVisible();
      
      // 単語リストに追加されることを確認
      const entriesList = page.locator('#entries-list');
      await expect(entriesList.locator('.entry-item')).toHaveCount(1);
      await expect(entriesList.locator('.entry-reading')).toHaveText('てすと');
      await expect(entriesList.locator('.entry-word')).toHaveText('テスト');
    });
  });

  test.describe('検索機能', () => {
    test.beforeEach(async () => {
      // テストデータを準備
      const addGameBtn = page.locator('#add-game-btn');
      await addGameBtn.click();
      
      const gameNameInput = page.locator('#game-name');
      await gameNameInput.fill('検索テストゲーム');
      
      const saveBtn = page.locator('#game-form button[type="submit"]');
      await saveBtn.click();
      
      // ゲームを選択（最後に追加されたオプション）
      const gameSelect = page.locator('#game-select');
      const lastOption = await gameSelect.locator('option').last().getAttribute('value');
      if (lastOption && lastOption !== '') {
        await gameSelect.selectOption(lastOption);
      }
      
      // テスト用単語を複数追加
      const entries = [
        { reading: 'ゆうしゃ', word: '勇者' },
        { reading: 'まおう', word: '魔王' },
        { reading: 'けん', word: '剣' }
      ];
      
      // 最初の有効なカテゴリを取得
      const categorySelect = page.locator('#entry-category');
      const firstCategoryOption = await categorySelect.locator('option').nth(1).getAttribute('value');
      
      for (const entry of entries) {
        const addEntryBtn = page.locator('#add-entry-btn');
        await addEntryBtn.click();
        
        await page.locator('#entry-reading').fill(entry.reading);
        await page.locator('#entry-word').fill(entry.word);
        
        if (firstCategoryOption) {
          await page.locator('#entry-category').selectOption(firstCategoryOption);
        }
        
        const entryForm = page.locator('#entry-form');
        await entryForm.locator('button[type="submit"]').click();
      }
    });

    test('検索テキスト入力でフィルタリングされる', async () => {
      // 全単語表示を確認
      const entriesList = page.locator('#entries-list');
      await expect(entriesList.locator('.entry-item')).toHaveCount(3);
      
      // 「ゆう」で検索
      const searchInput = page.locator('#search-input');
      await searchInput.fill('ゆう');
      
      // 勇者のみ表示されることを確認
      await expect(entriesList.locator('.entry-item')).toHaveCount(1);
      await expect(entriesList.locator('.entry-word')).toHaveText('勇者');
    });

    test('検索をクリアすると全件表示される', async () => {
      const searchInput = page.locator('#search-input');
      await searchInput.fill('ゆう');
      
      // 検索をクリア
      await searchInput.fill('');
      
      // 全件表示されることを確認
      const entriesList = page.locator('#entries-list');
      await expect(entriesList.locator('.entry-item')).toHaveCount(3);
    });
  });

  test.describe('ゲーム切り替え機能', () => {
    test('ゲーム切り替えで単語リストが更新される', async () => {
      // 2つのゲームを作成
      const games = ['ゲーム1', 'ゲーム2'];
      
      for (const gameName of games) {
        const addGameBtn = page.locator('#add-game-btn');
        await addGameBtn.click();
        
        const gameNameInput = page.locator('#game-name');
        await gameNameInput.fill(gameName);
        
        const saveBtn = page.locator('#game-form button[type="submit"]');
        await saveBtn.click();
      }
      
      // ゲーム1を選択して単語を追加
      const gameSelect = page.locator('#game-select');
      const game1Option = await gameSelect.locator('option').nth(-2).getAttribute('value'); // 最後から2番目
      const game2Option = await gameSelect.locator('option').last().getAttribute('value'); // 最後
      
      if (game1Option) {
        await gameSelect.selectOption(game1Option);
        
        const addEntryBtn = page.locator('#add-entry-btn');
        await addEntryBtn.click();
        
        await page.locator('#entry-reading').fill('ゲーム1のことば');
        await page.locator('#entry-word').fill('ゲーム1単語');
        
        // カテゴリを選択
        const categorySelect = page.locator('#entry-category');
        const firstCategoryOption = await categorySelect.locator('option').nth(1).getAttribute('value');
        if (firstCategoryOption) {
          await categorySelect.selectOption(firstCategoryOption);
        }
        
        const entryForm = page.locator('#entry-form');
        await entryForm.locator('button[type="submit"]').click();
        
        // ゲーム2に切り替え
        if (game2Option) {
          await gameSelect.selectOption(game2Option);
          
          // 単語リストが空になることを確認
          const entriesList = page.locator('#entries-list');
          await expect(entriesList.locator('.entry-item')).toHaveCount(0);
          
          // タイトルが更新されることを確認
          const currentGameTitle = page.locator('#current-game-title');
          await expect(currentGameTitle).toHaveText('ゲーム2');
        }
      }
    });
  });
});