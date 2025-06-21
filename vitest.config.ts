import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		exclude: ["node_modules", "dist", "tests/e2e/**", "test-*.ts"],
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	esbuild: {
		target: "node22",
	},
});
