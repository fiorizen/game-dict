import type { Config } from "drizzle-kit";

export default {
	schema: "./src/database/schema.ts",
	out: "./migrations",
	driver: "better-sqlite",
	dbCredentials: {
		url: "./test-data/game-dict.db"
	},
	verbose: true,
	strict: true,
} satisfies Config;