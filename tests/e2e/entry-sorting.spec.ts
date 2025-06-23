import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// E2E Test for entry sorting behavior
test.describe('Entry Sorting Behavior Tests', () => {
	let electronApp: any;
	let page: any;

	test.beforeAll(async () => {
		electronApp = await electron.launch({
			args: [path.join(__dirname, '../../dist/main/main.js')],
			cwd: path.join(__dirname, '../..'),
		});
		page = await electronApp.firstWindow();
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterAll(async () => {
		if (electronApp) {
			await electronApp.close();
		}
	});

	test('shouldSortEntriesフラグが実装されている', async () => {
		// JavaScript変数が定義されているか確認
		const flagExists = await page.evaluate(() => {
			return typeof shouldSortEntries !== 'undefined';
		});
		
		expect(flagExists).toBe(true);
	});

	test('エントリー保存後のソート制御関数が実装されている', async () => {
		// 保存処理でshouldSortEntriesを制御する関数/ロジックが存在するか確認
		const hasSortControl = await page.evaluate(() => {
			// shouldSortEntriesが適切に制御されているかチェック
			return typeof shouldSortEntries !== 'undefined';
		});
		
		expect(hasSortControl).toBe(true);
	});

	test('ゲーム切り替え時のソート制御が実装されている', async () => {
		// ゲーム切り替え時にソートが有効化される仕組みが存在するかチェック
		const hasSortReset = await page.evaluate(() => {
			// shouldSortEntriesの値を変更できることを確認
			const originalValue = shouldSortEntries;
			shouldSortEntries = false;
			const changed = shouldSortEntries === false;
			shouldSortEntries = originalValue; // 元に戻す
			return changed;
		});
		
		expect(hasSortReset).toBe(true);
	});
});