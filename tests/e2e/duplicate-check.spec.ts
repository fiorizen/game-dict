import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// E2E Test for duplicate entry prevention
test.describe('Duplicate Entry Prevention Tests', () => {
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

	test('重複チェック関数が実装されている', async () => {
		// JavaScript関数が定義されているか確認
		const functionsExist = await page.evaluate(() => {
			return typeof checkDuplicateEntry === 'function';
		});
		
		expect(functionsExist).toBe(true);
	});
});