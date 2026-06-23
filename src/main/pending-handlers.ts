import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { Database } from "../database/index.js";
import { log } from "../shared/logger.js";

export interface PendingEntry {
	gameCode: string;
	gameName: string;
	word: string;
	description: string;
	reading: string;
	categoryName: string;
}

export class PendingHandlers {
	private db: Database;

	constructor() {
		this.db = Database.getInstance();
	}

	private getPendingDir(): string {
		const isTestEnvironment =
			process.env.NODE_ENV === "test" || process.env.VITEST === "true";
		const csvDir = isTestEnvironment
			? path.join(process.cwd(), "test-data", "csv")
			: path.join(process.cwd(), "csv");
		return path.join(csvDir, "pending");
	}

	getAll(): PendingEntry[] {
		const pendingDir = this.getPendingDir();
		if (!fs.existsSync(pendingDir)) return [];

		const games = this.db.games.getAll();
		const gamesByCode = new Map(games.map((g) => [g.code, g]));

		const entries: PendingEntry[] = [];
		const files = fs
			.readdirSync(pendingDir)
			.filter((f) => f.startsWith("game-") && f.endsWith(".csv"))
			.sort();

		for (const file of files) {
			const code = file.slice("game-".length, -".csv".length);
			const game = gamesByCode.get(code);
			const filePath = path.join(pendingDir, file);

			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const rows = parse(content, {
					columns: true,
					skip_empty_lines: true,
					comment: "#",
				}) as Array<{
					word: string;
					reading?: string;
					description?: string;
					category_name?: string;
				}>;

				for (const row of rows) {
					entries.push({
						gameCode: code,
						gameName: game?.name ?? code,
						word: row.word,
						reading: row.reading ?? "",
						description: row.description ?? "",
						categoryName: row.category_name ?? "",
					});
				}
			} catch (error) {
				log.error(`保留CSVの読み込みに失敗: ${filePath}`, error);
			}
		}

		return entries.sort((a, b) => a.gameName.localeCompare(b.gameName, "ja"));
	}

	confirm(
		gameCode: string,
		word: string,
		description: string,
		yomi: string,
		categoryId: number,
	): void {
		const games = this.db.games.getAll();
		const game = games.find((g) => g.code === gameCode);
		if (!game) throw new Error(`Game not found: ${gameCode}`);

		this.db.entries.create({
			game_id: game.id,
			category_id: categoryId,
			reading: yomi,
			word,
			description: description || undefined,
		});

		this.removeFromPending(gameCode, word);
		log.info("保留ワードを確定しました", { gameCode, word, yomi });
	}

	discard(gameCode: string, word: string): void {
		this.removeFromPending(gameCode, word);
		log.info("保留ワードを却下しました", { gameCode, word });
	}

	updateWord(gameCode: string, oldWord: string, newWord: string): void {
		if (!newWord.trim()) {
			throw new Error("単語が空です");
		}

		const pendingDir = this.getPendingDir();
		const filePath = path.join(pendingDir, `game-${gameCode}.csv`);
		if (!fs.existsSync(filePath)) {
			throw new Error(`保留CSVが見つかりません: ${gameCode}`);
		}

		const content = fs.readFileSync(filePath, "utf-8");
		const rows = parse(content, {
			columns: true,
			skip_empty_lines: true,
			comment: "#",
		}) as Array<{
			word: string;
			reading?: string;
			description?: string;
			category_name?: string;
		}>;

		if (rows.some((r) => r.word === newWord)) {
			throw new Error(`既に保留中の単語です: ${newWord}`);
		}
		if (this.existsInConfirmed(gameCode, newWord)) {
			throw new Error(`既に登録済みの単語です: ${newWord}`);
		}

		const target = rows.find((r) => r.word === oldWord);
		if (!target) {
			throw new Error(`対象の単語が見つかりません: ${oldWord}`);
		}
		target.word = newWord;

		const newContent = stringify(rows, {
			header: true,
			columns: ["word", "reading", "description", "category_name"],
		});
		fs.writeFileSync(filePath, newContent, "utf-8");
		log.info("保留ワードの単語を更新しました", { gameCode, oldWord, newWord });
	}

	private existsInConfirmed(gameCode: string, word: string): boolean {
		const pendingDir = this.getPendingDir();
		const filePath = path.join(pendingDir, "..", `game-${gameCode}.csv`);
		if (!fs.existsSync(filePath)) return false;

		const content = fs.readFileSync(filePath, "utf-8");
		const rows = parse(content, {
			columns: true,
			skip_empty_lines: true,
			comment: "#",
		}) as Array<{ word?: string }>;

		return rows.some((r) => r.word === word);
	}

	private removeFromPending(gameCode: string, word: string): void {
		const pendingDir = this.getPendingDir();
		const filePath = path.join(pendingDir, `game-${gameCode}.csv`);
		if (!fs.existsSync(filePath)) return;

		const content = fs.readFileSync(filePath, "utf-8");
		const rows = parse(content, {
			columns: true,
			skip_empty_lines: true,
			comment: "#",
		}) as Array<{
			word: string;
			reading?: string;
			description?: string;
			category_name?: string;
		}>;

		const filtered = rows.filter((r) => r.word !== word);

		if (filtered.length === 0) {
			fs.unlinkSync(filePath);
		} else {
			const newContent = stringify(filtered, {
				header: true,
				columns: ["word", "reading", "description", "category_name"],
			});
			fs.writeFileSync(filePath, newContent, "utf-8");
		}
	}
}
