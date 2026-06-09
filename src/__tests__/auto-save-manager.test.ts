import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutoSaveResult } from "../main/auto-save-manager.js";

const { mockExec } = vi.hoisted(() => ({ mockExec: vi.fn() }));

const { mockExistsSync, mockReaddirSync, mockStatSync } = vi.hoisted(() => ({
	mockExistsSync: vi.fn().mockReturnValue(false),
	mockReaddirSync: vi.fn().mockReturnValue([]),
	mockStatSync: vi.fn().mockReturnValue({ size: 100 }),
}));

vi.mock("node:fs", () => ({
	default: {},
	existsSync: mockExistsSync,
	readdirSync: mockReaddirSync,
	statSync: mockStatSync,
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
	readFileSync: vi.fn().mockReturnValue("{}"),
}));

vi.mock("electron", () => ({
	app: { getPath: vi.fn().mockReturnValue("/tmp/test-user-data") },
}));

vi.mock("node:child_process", () => ({ exec: mockExec }));

vi.mock("node:os", () => ({
	homedir: vi.fn().mockReturnValue("/Users/testuser"),
}));

const mockExportToGitCsv = vi.fn().mockResolvedValue([]);
const mockExportAllGamesToMicrosoftIme = vi.fn().mockResolvedValue({
	filePath: "/Users/testuser/Dev/ime/game-dict/export/all-games.txt",
	duplicatesFilePath:
		"/Users/testuser/Dev/ime/game-dict/export/all-games-duplicates.txt",
	stats: { totalEntries: 10, uniqueEntries: 10, duplicatesRemoved: 0 },
});

vi.mock("../main/csv-handlers.js", () => ({
	CSVHandlers: vi.fn().mockImplementation(() => ({
		exportToGitCsv: mockExportToGitCsv,
		exportAllGamesToMicrosoftIme: mockExportAllGamesToMicrosoftIme,
	})),
}));

vi.mock("../shared/logger.js", () => ({
	log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

type PrivateManager = { performAutoSave: () => Promise<AutoSaveResult> };

describe("AutoSaveManager - IME registration", () => {
	let manager: PrivateManager;

	beforeEach(async () => {
		mockExistsSync.mockReturnValue(false);
		mockReaddirSync.mockReturnValue([]);
		mockStatSync.mockReturnValue({ size: 100 });

		const { AutoSaveManager } = await import("../main/auto-save-manager.js");
		manager = new AutoSaveManager() as unknown as PrivateManager;
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	function successExec(
		_cmd: string,
		_opts: object,
		cb: (err: Error | null, stdout?: string) => void,
	): void {
		cb(null, "done");
	}

	describe("exit 0: 追加あり → update + reload", () => {
		it("exportAllGamesToMicrosoftIme を呼ぶ", async () => {
			mockExec.mockImplementation(successExec);
			await manager.performAutoSave();
			expect(mockExportAllGamesToMicrosoftIme).toHaveBeenCalledOnce();
		});

		it("update と reload の両方を実行する", async () => {
			const commands: string[] = [];
			mockExec.mockImplementation(
				(
					cmd: string,
					_opts: object,
					cb: (err: Error | null, stdout?: string) => void,
				) => {
					commands.push(cmd);
					cb(null, "done");
				},
			);

			await manager.performAutoSave();

			expect(commands).toHaveLength(2);
			expect(commands[0]).toMatch(/dict-tool update コンテンツ/);
			expect(commands[1]).toMatch(/dict-tool reload/);
		});

		it("update に all-games.txt のパスを渡す", async () => {
			const commands: string[] = [];
			mockExec.mockImplementation(
				(
					cmd: string,
					_opts: object,
					cb: (err: Error | null, stdout?: string) => void,
				) => {
					commands.push(cmd);
					cb(null, "done");
				},
			);

			await manager.performAutoSave();

			expect(commands[0]).toContain("all-games.txt");
		});

		it("exec に dict-tool ディレクトリの cwd を渡す", async () => {
			let capturedOpts: { cwd?: string } | undefined;
			mockExec.mockImplementation(
				(
					_cmd: string,
					opts: { cwd?: string },
					cb: (err: Error | null, stdout?: string) => void,
				) => {
					capturedOpts = opts;
					cb(null, "done");
				},
			);

			await manager.performAutoSave();

			expect(capturedOpts?.cwd).toBe("/Users/testuser/Dev/ime/dict-tool");
		});

		it("imeRegistration.success = true を返す", async () => {
			mockExec.mockImplementation(successExec);
			const result = await manager.performAutoSave();
			expect(result.imeRegistration?.success).toBe(true);
			expect(result.imeRegistration?.skipped).toBe(false);
		});

		it("自動保存自体も success = true", async () => {
			mockExec.mockImplementation(successExec);
			const result = await manager.performAutoSave();
			expect(result.success).toBe(true);
		});
	});

	describe("exit 1: 追加なし → reload スキップ", () => {
		it("reload を実行しない", async () => {
			const commands: string[] = [];
			mockExec.mockImplementationOnce(
				(cmd: string, _opts: object, cb: (err: Error | null) => void) => {
					commands.push(cmd);
					cb(Object.assign(new Error("No additions"), { code: 1 }));
				},
			);

			await manager.performAutoSave();

			expect(commands).toHaveLength(1);
			expect(commands[0]).toMatch(/dict-tool update/);
		});

		it("imeRegistration.skipped = true, success = true", async () => {
			mockExec.mockImplementationOnce(
				(_cmd: string, _opts: object, cb: (err: Error | null) => void) => {
					cb(Object.assign(new Error("No additions"), { code: 1 }));
				},
			);

			const result = await manager.performAutoSave();

			expect(result.imeRegistration?.skipped).toBe(true);
			expect(result.imeRegistration?.success).toBe(true);
		});

		it("自動保存自体は success = true", async () => {
			mockExec.mockImplementationOnce(
				(_cmd: string, _opts: object, cb: (err: Error | null) => void) => {
					cb(Object.assign(new Error("No additions"), { code: 1 }));
				},
			);

			const result = await manager.performAutoSave();

			expect(result.success).toBe(true);
		});
	});

	describe("exit 2+: エラー → 自動保存は継続", () => {
		it("imeRegistration.success = false だが autoSave.success = true", async () => {
			mockExec.mockImplementation(
				(_cmd: string, _opts: object, cb: (err: Error | null) => void) => {
					cb(Object.assign(new Error("Dictionary not found"), { code: 2 }));
				},
			);

			const result = await manager.performAutoSave();

			expect(result.success).toBe(true);
			expect(result.imeRegistration?.success).toBe(false);
		});

		it("imeRegistration.reason にエラーメッセージを含む", async () => {
			mockExec.mockImplementation(
				(_cmd: string, _opts: object, cb: (err: Error | null) => void) => {
					cb(Object.assign(new Error("Dictionary not found"), { code: 2 }));
				},
			);

			const result = await manager.performAutoSave();

			expect(result.imeRegistration?.reason).toBeDefined();
		});
	});

	describe("ファイルサイズ減少時", () => {
		it("IME登録を実行しない", async () => {
			mockExistsSync.mockReturnValue(true);
			mockReaddirSync.mockReturnValue(["game-test.csv"] as unknown as string[]);
			mockStatSync
				.mockReturnValueOnce({ size: 100 }) // before: csv file
				.mockReturnValueOnce({ size: 50 }); // after: csv file (decreased)

			await manager.performAutoSave();

			expect(mockExportAllGamesToMicrosoftIme).not.toHaveBeenCalled();
		});
	});
});
