import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

describe("Renderer JavaScript Functions Tests", () => {
	let mainJsContent: string;

	beforeAll(() => {
		// Read the main.js file to check function definitions
		const mainJsPath = path.join(process.cwd(), "src/renderer/scripts/main.js");
		mainJsContent = fs.readFileSync(mainJsPath, "utf8");
	});

	describe("HTMLから呼び出される関数の定義確認", () => {
		it("editEntryInline関数が定義されている", () => {
			expect(mainJsContent).toContain("function _editEntryInline");
		});

		it("saveNewEntry関数が定義されている", () => {
			expect(mainJsContent).toContain("function _saveNewEntry");
		});

		it("saveEditedEntry関数が定義されている", () => {
			expect(mainJsContent).toContain("function _saveEditedEntry");
		});

		it("clearNewEntry関数が定義されている", () => {
			expect(mainJsContent).toContain("function _clearNewEntry");
		});

		it("cancelEditEntry関数が定義されている", () => {
			expect(mainJsContent).toContain("function _cancelEditEntry");
		});
	});

	describe("グローバル関数の公開確認", () => {
		it("editEntryInline関数がグローバルスコープに公開されている", () => {
			expect(mainJsContent).toContain(
				"globalThis.editEntryInline = _editEntryInline",
			);
		});

		it("saveNewEntry関数がグローバルスコープに公開されている", () => {
			expect(mainJsContent).toContain(
				"globalThis.saveNewEntry = _saveNewEntry",
			);
		});

		it("saveEditedEntry関数がグローバルスコープに公開されている", () => {
			expect(mainJsContent).toContain(
				"globalThis.saveEditedEntry = _saveEditedEntry",
			);
		});

		it("clearNewEntry関数がグローバルスコープに公開されている", () => {
			expect(mainJsContent).toContain(
				"globalThis.clearNewEntry = _clearNewEntry",
			);
		});

		it("cancelEditEntry関数がグローバルスコープに公開されている", () => {
			expect(mainJsContent).toContain(
				"globalThis.cancelEditEntry = _cancelEditEntry",
			);
		});
	});

	describe("関数とHTML呼び出しの整合性確認", () => {
		let indexHtmlContent: string;

		beforeAll(() => {
			const indexHtmlPath = path.join(process.cwd(), "src/renderer/index.html");
			indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf8");
		});

		it("HTMLで呼び出される関数がすべて定義されている", () => {
			// Extract onclick function calls from HTML
			const onclickMatches = indexHtmlContent.match(/onclick="([^"]+)"/g) || [];
			const functionCalls = onclickMatches
				.map((match) => match.replace(/onclick="([^(]+)\([^)]*\)"/, "$1"))
				.filter((func) => func !== "onclick"); // Filter out malformed matches

			// Check that each function is either defined directly or has a global assignment
			for (const functionName of functionCalls) {
				const hasDirectDefinition = mainJsContent.includes(
					`function ${functionName}`,
				);
				const hasGlobalAssignment = mainJsContent.includes(
					`globalThis.${functionName} =`,
				);

				expect(hasDirectDefinition || hasGlobalAssignment).toBe(true);
			}
		});

		it("編集関連の必須関数が存在する", () => {
			// These are the core functions required for entry editing functionality
			const requiredFunctions = [
				"editEntryInline",
				"saveEditedEntry",
				"cancelEditEntry",
				"saveNewEntry",
				"clearNewEntry",
			];

			for (const functionName of requiredFunctions) {
				const hasGlobalAssignment = mainJsContent.includes(
					`globalThis.${functionName} =`,
				);
				expect(hasGlobalAssignment).toBe(true);
			}
		});
	});

	describe("関数シグネチャの整合性確認", () => {
		it("_editEntryInline関数が正しいパラメータを受け取る", () => {
			const functionMatch = mainJsContent.match(
				/function _editEntryInline\(([^)]*)\)/,
			);
			expect(functionMatch).not.toBeNull();
			expect(functionMatch?.[1]).toContain("entryId");
		});

		it("_saveEditedEntry関数が正しいパラメータを受け取る", () => {
			const functionMatch = mainJsContent.match(
				/function _saveEditedEntry\(([^)]*)\)/,
			);
			expect(functionMatch).not.toBeNull();
			const params = functionMatch?.[1];
			expect(params).toContain("button");
			expect(params).toContain("entryId");
		});

		it("_cancelEditEntry関数が正しいパラメータを受け取る", () => {
			const functionMatch = mainJsContent.match(
				/function _cancelEditEntry\(([^)]*)\)/,
			);
			expect(functionMatch).not.toBeNull();
			const params = functionMatch?.[1];
			expect(params).toContain("button") || expect(params).toContain("_button");
			expect(params).toContain("entryId") ||
				expect(params).toContain("_entryId");
		});
	});

	describe("エラーハンドリング関数の存在確認", () => {
		it("showError関数が定義されている", () => {
			expect(mainJsContent).toContain("function showError") ||
				expect(mainJsContent).toContain("showError =");
		});

		it("showSuccess関数が定義されている", () => {
			expect(mainJsContent).toContain("function showSuccess") ||
				expect(mainJsContent).toContain("showSuccess =");
		});

		it("validateEntryData関数が定義されている", () => {
			expect(mainJsContent).toContain("function validateEntryData");
		});

		it("escapeHtml関数が定義されている", () => {
			expect(mainJsContent).toContain("function escapeHtml");
		});
	});

	describe("コードの一貫性確認", () => {
		it("同じ機能の関数名に一貫性がある", () => {
			// Check that internal functions use underscore prefix consistently
			const internalFunctions = [
				"_editEntryInline",
				"_saveEditedEntry",
				"_cancelEditEntry",
				"_saveNewEntry",
				"_clearNewEntry",
			];

			for (const funcName of internalFunctions) {
				expect(mainJsContent).toContain(`function ${funcName}`);
			}
		});

		it("HTMLとJavaScriptの関数名マッピングが正しい", () => {
			// Verify that the mapping between HTML onclick and JS functions is correct
			const mappings = [
				{ html: "editEntryInline", js: "_editEntryInline" },
				{ html: "saveEditedEntry", js: "_saveEditedEntry" },
				{ html: "cancelEditEntry", js: "_cancelEditEntry" },
				{ html: "saveNewEntry", js: "_saveNewEntry" },
				{ html: "clearNewEntry", js: "_clearNewEntry" },
			];

			for (const mapping of mappings) {
				const globalAssignment = `globalThis.${mapping.html} = ${mapping.js}`;
				expect(mainJsContent).toContain(globalAssignment);
			}
		});
	});

	describe("IME変換中のEnter誤発火ガード", () => {
		let inboxJsContent: string;

		beforeAll(() => {
			const inboxJsPath = path.join(
				process.cwd(),
				"src/renderer/scripts/inbox.js",
			);
			inboxJsContent = fs.readFileSync(inboxJsPath, "utf8");
		});

		it("inbox.jsのよみ入力EnterハンドラがisComposingガードを持つ", () => {
			// IME変換確定のEnter(isComposing=true)で確定/行削除が誤発火しないこと
			const guarded =
				/yomiInput\.addEventListener\(\s*["']keydown["'],[\s\S]*?if\s*\(\s*e\.isComposing\s*\)\s*return;[\s\S]*?e\.key === "Enter"/;
			expect(inboxJsContent).toMatch(guarded);
		});

		it("main.jsのdescription EnterハンドラがisComposingガードを持つ", () => {
			const guarded =
				/name === "description"[\s\S]*?addEventListener\(\s*["']keydown["'],[\s\S]*?if\s*\(\s*e\.isComposing\s*\)\s*return;[\s\S]*?e\.key === "Enter"/;
			expect(mainJsContent).toMatch(guarded);
		});
	});
});
