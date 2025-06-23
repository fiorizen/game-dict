import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// E2E Test for keyboard navigation functionality
test.describe('Keyboard Navigation E2E Tests', () => {
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

	test('キーボードナビゲーション関数が実装されている', async () => {
		// JavaScript関数が定義されているか確認
		const functionsExist = await page.evaluate(() => {
			return typeof addKeyboardNavigationListeners === 'function' &&
			       typeof handleVerticalNavigation === 'function' &&
			       typeof attemptNavigationSave === 'function';
		});
		
		expect(functionsExist).toBe(true);
	});

	test('バリデーション関数が実装されている', async () => {
		// JavaScript関数が定義されているか確認
		const functionsExist = await page.evaluate(() => {
			return typeof showValidationError === 'function' &&
			       typeof clearValidationErrors === 'function';
		});
		
		expect(functionsExist).toBe(true);
	});
});