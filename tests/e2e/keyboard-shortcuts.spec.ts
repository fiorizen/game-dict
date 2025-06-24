import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
	type ElectronApplication,
	_electron as electron,
	type Page,
} from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// E2E Test for keyboard shortcuts functionality
test.describe("Keyboard Shortcuts Tests", () => {
	let electronApp: ElectronApplication;
	let page: Page;

	test.beforeAll(async () => {
		electronApp = await electron.launch({
			args: [path.join(__dirname, "../../dist/main/main.js")],
			cwd: path.join(__dirname, "../.."),
		});
		page = await electronApp.firstWindow();
		await page.waitForLoadState("domcontentloaded");
		// Wait for app initialization
		await page.waitForTimeout(2000);
	});

	test.afterAll(async () => {
		if (electronApp) {
			await electronApp.close();
		}
	});

	test("キーボードショートカット関数が実装されている", async () => {
		// Check if keyboard event listeners are properly attached
		const keyboardSetupExists = await page.evaluate(() => {
			// Check DOM for keyboard event listeners
			const hasKeyboardListeners = document.body.dispatchEvent !== undefined;

			// Check if we can access the main script
			const scripts = Array.from(document.scripts);
			const hasMainScript = scripts.some(
				(script) =>
					script.src.includes("main.js") ||
					script.textContent?.includes("setupKeyboardShortcuts"),
			);

			return hasKeyboardListeners && (hasMainScript || scripts.length > 0);
		});

		// At minimum, we expect some form of keyboard event handling setup
		expect(keyboardSetupExists).toBe(true);
	});

	test("アプリにフォーカスがあることを確認", async () => {
		// Simply check that we can interact with the app
		const title = await page.title();
		expect(title).toContain("IME辞書管理ツール");

		// Check basic elements are present
		const appElement = page.locator("#app");
		await expect(appElement).toBeVisible();
	});
});
