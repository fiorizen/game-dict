import { DrizzleConnection } from "./drizzle-connection.js";
import { DrizzleGameModel } from "./models/drizzle-game.js";
import { DrizzleCategoryModel } from "./models/drizzle-category.js";
import { DrizzleEntryModel } from "./models/drizzle-entry.js";

export class DrizzleDatabase {
	private static instance: DrizzleDatabase;
	private connection: DrizzleConnection;
	public games: DrizzleGameModel;
	public categories: DrizzleCategoryModel;
	public entries: DrizzleEntryModel;

	private constructor() {
		this.connection = DrizzleConnection.getInstance();
		const db = this.connection.getDatabase();
		
		this.games = new DrizzleGameModel(db);
		this.categories = new DrizzleCategoryModel(db);
		this.entries = new DrizzleEntryModel(db);
	}

	public static getInstance(): DrizzleDatabase {
		if (!DrizzleDatabase.instance) {
			DrizzleDatabase.instance = new DrizzleDatabase();
		}
		return DrizzleDatabase.instance;
	}

	public static resetInstance(): void {
		if (DrizzleDatabase.instance) {
			DrizzleConnection.resetInstance();
		}
		DrizzleDatabase.instance = undefined as any;
	}

	public getDbPath(): string {
		return this.connection.getDbPath();
	}

	public close(): void {
		this.connection.close();
	}

	public getConnection(): DrizzleConnection {
		return this.connection;
	}
}