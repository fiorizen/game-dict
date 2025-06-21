import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts", "**/*.spec.ts"],
		exclude: ["node_modules", "dist", "test-*.ts"],
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	esbuild: {
		target: "node22",
	},
});
