import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PendingHandlers } from "../main/pending-handlers.js";
import { TestDatabaseHelper } from "./helpers/index.js";

describe("PendingHandlers", () => {
	let testHelper: TestDatabaseHelper;
	let pendingHandlers: PendingHandlers;
	let pendingDir: string;

	beforeEach(() => {
		testHelper = TestDatabaseHelper.getInstance();
		pendingHandlers = new PendingHandlers();
		pendingDir = path.join(process.cwd(), "test-data", "csv", "pending");

		if (fs.existsSync(pendingDir)) {
			fs.rmSync(pendingDir, { recursive: true });
		}
	});

	afterEach(() => {
		if (fs.existsSync(pendingDir)) {
			fs.rmSync(pendingDir, { recursive: true });
		}
	});

	describe("getAll", () => {
		it("csv/pending/ が存在しない場合は空配列を返す", () => {
			expect(pendingHandlers.getAll()).toEqual([]);
		});

		it("保留CSVのエントリを返す", () => {
			const game = testHelper.createUniqueGame("Pending Test Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,武器の説明\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries).toHaveLength(1);
			expect(entries[0].word).toBe("武器A");
			expect(entries[0].description).toBe("武器の説明");
			expect(entries[0].gameCode).toBe(game.code);
			expect(entries[0].gameName).toBe(game.name);
		});

		it("複数ゲームの保留エントリをまとめて返す", () => {
			const gameA = testHelper.createUniqueGame("Game A");
			const gameB = testHelper.createUniqueGame("Game B");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${gameA.code}.csv`),
				"word,description\n単語A,説明A\n",
			);
			fs.writeFileSync(
				path.join(pendingDir, `game-${gameB.code}.csv`),
				"word,description\n単語B,説明B\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries).toHaveLength(2);
			const words = entries.map((e) => e.word);
			expect(words).toContain("単語A");
			expect(words).toContain("単語B");
		});

		it("reading列がある場合、readingを返す", () => {
			const game = testHelper.createUniqueGame("Reading Test Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,reading,description\n武器A,ぶきA,武器の説明\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries[0].reading).toBe("ぶきA");
		});

		it("category_name列がある場合、categoryNameを返す", () => {
			const game = testHelper.createUniqueGame("Category Name Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,reading,description,category_name\nリンカン,りんかん,キャラクター名,人名\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries[0].categoryName).toBe("人名");
		});

		it("category_name列がない場合、categoryNameは空文字を返す", () => {
			const game = testHelper.createUniqueGame("No Category Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,武器の説明\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries[0].categoryName).toBe("");
		});

		it("reading列がない場合、readingは空文字を返す", () => {
			const game = testHelper.createUniqueGame("No Reading Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,武器の説明\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries[0].reading).toBe("");
		});

		it("ゲームが存在しないコードの場合、gameCodeをgameNameとして使う", () => {
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, "game-unknown-code.csv"),
				"word,description\n謎の単語,説明\n",
			);

			const entries = pendingHandlers.getAll();

			expect(entries).toHaveLength(1);
			expect(entries[0].gameCode).toBe("unknown-code");
			expect(entries[0].gameName).toBe("unknown-code");
		});
	});

	describe("confirm", () => {
		it("DBにエントリを追加する", () => {
			const game = testHelper.createUniqueGame("Confirm Test Game");
			const categories = testHelper.getDefaultCategories();
			const category = categories[0];

			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,武器の説明\n",
			);

			pendingHandlers.confirm(
				game.code,
				"武器A",
				"武器の説明",
				"ぶきA",
				category.id,
			);

			const db = testHelper.getDatabase();
			const entries = db.entries.getByGameId(game.id);
			expect(
				entries.some((e) => e.word === "武器A" && e.reading === "ぶきA"),
			).toBe(true);
		});

		it("確定後に保留CSVからそのエントリを削除する", () => {
			const game = testHelper.createUniqueGame("Confirm Remove Test");
			const categories = testHelper.getDefaultCategories();

			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,説明A\n武器B,説明B\n",
			);

			pendingHandlers.confirm(
				game.code,
				"武器A",
				"説明A",
				"ぶきA",
				categories[0].id,
			);

			const remaining = pendingHandlers.getAll();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].word).toBe("武器B");
		});

		it("最後のエントリを確定すると保留CSVファイルを削除する", () => {
			const game = testHelper.createUniqueGame("Confirm Last Entry");
			const categories = testHelper.getDefaultCategories();

			fs.mkdirSync(pendingDir, { recursive: true });
			const pendingFile = path.join(pendingDir, `game-${game.code}.csv`);
			fs.writeFileSync(pendingFile, "word,description\n武器A,説明A\n");

			pendingHandlers.confirm(
				game.code,
				"武器A",
				"説明A",
				"ぶきA",
				categories[0].id,
			);

			expect(fs.existsSync(pendingFile)).toBe(false);
		});

		it("存在しないゲームコードを渡すとエラーをスローする", () => {
			const categories = testHelper.getDefaultCategories();
			expect(() =>
				pendingHandlers.confirm(
					"nonexistent-code",
					"単語",
					"説明",
					"よみ",
					categories[0].id,
				),
			).toThrow();
		});
	});

	describe("discard", () => {
		it("保留CSVからエントリを削除する", () => {
			const game = testHelper.createUniqueGame("Discard Test Game");
			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,説明A\n武器B,説明B\n",
			);

			pendingHandlers.discard(game.code, "武器A");

			const entries = pendingHandlers.getAll();
			expect(entries).toHaveLength(1);
			expect(entries[0].word).toBe("武器B");
		});

		it("最後のエントリを却下するとファイルを削除する", () => {
			const game = testHelper.createUniqueGame("Discard Last Test");
			fs.mkdirSync(pendingDir, { recursive: true });
			const pendingFile = path.join(pendingDir, `game-${game.code}.csv`);
			fs.writeFileSync(pendingFile, "word,description\n武器A,説明A\n");

			pendingHandlers.discard(game.code, "武器A");

			expect(fs.existsSync(pendingFile)).toBe(false);
		});

		it("存在しないファイルの場合はエラーにならない", () => {
			expect(() =>
				pendingHandlers.discard("nonexistent-code", "単語"),
			).not.toThrow();
		});

		it("DBには何も追加しない", () => {
			const game = testHelper.createUniqueGame("Discard No DB Test");
			const db = testHelper.getDatabase();
			const entriesBefore = db.entries.getByGameId(game.id);

			fs.mkdirSync(pendingDir, { recursive: true });
			fs.writeFileSync(
				path.join(pendingDir, `game-${game.code}.csv`),
				"word,description\n武器A,説明A\n",
			);

			pendingHandlers.discard(game.code, "武器A");

			const entriesAfter = db.entries.getByGameId(game.id);
			expect(entriesAfter).toHaveLength(entriesBefore.length);
		});
	});
});
