import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", "examples"],
    pool: "forks", // Use forks instead of threads to support process.chdir
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 10000, // Increase timeout for async operations
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
});
