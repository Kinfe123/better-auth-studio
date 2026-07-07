import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { detectDatabase, detectDatabaseWithDialect } from "../src/utils/database-detection";

describe("Database detection", () => {
  const testDir = join(process.cwd(), ".test-temp-db-detection");

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("detects direct Kysely dependencies", async () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: {
          kysely: "^0.28.8",
        },
      }),
    );

    await expect(detectDatabase(testDir)).resolves.toEqual({
      name: "kysely",
      version: "0.28.8",
    });
  });

  it("detects Kysely's Postgres dialect from installed drivers", async () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: {
          kysely: "^0.28.8",
          pg: "^8.13.0",
        },
      }),
    );

    await expect(detectDatabaseWithDialect(testDir)).resolves.toEqual({
      name: "kysely",
      version: "0.28.8",
      dialect: "postgresql",
      adapter: "kysely",
    });
  });
});
