import { DatabaseConnection } from "./connection.js";
import { CategoryModel } from "./models/category.js";
import { EntryModel } from "./models/entry.js";
import { GameModel } from "./models/game.js";

export class Database {
	private static instance: Database;
	private connection: DatabaseConnection;
	public games: GameModel;
	public categories: CategoryModel;
	public entries: EntryModel;

	private constructor() {
		this.connection = DatabaseConnection.getInstance();
		const db = this.connection.getDatabase();

		this.games = new GameModel(db);
		this.categories = new CategoryModel(db);
		this.entries = new EntryModel(db);
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database();
		}
		return Database.instance;
	}

	public static resetInstance(): void {
		if (Database.instance) {
			try {
				Database.instance.close();
			} catch {
				// Ignore errors during close
			}
		}
		Database.instance = undefined as any;
	}

	public getDbPath(): string {
		return this.connection.getDbPath();
	}

	public close(): void {
		this.connection.close();
	}
}

export * from "../shared/types.js";
export * from "./models/category.js";
export * from "./models/entry.js";
export * from "./models/game.js";
