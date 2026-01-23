import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join, isAbsolute } from "path";
import { getAuthAdapter } from "../src/auth-adapter";
describe("CLI", () => {
  const testDir = join(process.cwd(), ".test-temp-cli");

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

  it("should find auth config path in current directory", async () => {
    const authConfigContent = `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({ secret: "test" });
    `;

    writeFileSync(join(testDir, "auth.ts"), authConfigContent);
    const possibleConfigFiles = ["auth.ts", "auth.js"];
    let foundPath: string | null = null;
    for (const configFile of possibleConfigFiles) {
      const configPath = join(testDir, configFile);
      if (existsSync(configPath)) {
        foundPath = configPath;
        break;
      }
    }

    expect(foundPath).toBeTruthy();
    expect(foundPath).toContain("auth.ts");
  });

  it("should find auth config in src directory", async () => {
    mkdirSync(join(testDir, "src"), { recursive: true });

    const authConfigContent = `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({ secret: "test" });
    `;

    writeFileSync(join(testDir, "src", "auth.ts"), authConfigContent);

    const possibleConfigFiles = ["src/auth.ts", "auth.ts"];
    let foundPath: string | null = null;

    for (const configFile of possibleConfigFiles) {
      const configPath = join(testDir, configFile);
      if (existsSync(configPath)) {
        foundPath = configPath;
        break;
      }
    }

    expect(foundPath).toBeTruthy();
    expect(foundPath).toContain("src/auth.ts");
  });

  it("should handle missing config file", () => {
    const possibleConfigFiles = ["auth.ts", "auth.js"];
    let foundPath: string | null = null;

    for (const configFile of possibleConfigFiles) {
      const configPath = join(testDir, configFile);
      if (existsSync(configPath)) {
        foundPath = configPath;
        break;
      }
    }

    expect(foundPath).toBeNull();
  });
  it("should handle custom config file path", async () => {
    mkdirSync(join(testDir, "src/server"), { recursive: true });
    const configPath = join(testDir, "src/server/auth.ts");
    writeFileSync(
      configPath,
      `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({ secret: "test" });
    `,
    );
    const result = await getAuthAdapter(configPath);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("getSessions");
    expect(configPath).toContain("src/server/auth.ts");
  });
  it("should normalize config path correctly", () => {
    const normalizePath = (configPath: string | null): string | null => {
      if (!configPath) return null;

      if (isAbsolute(configPath) && existsSync(configPath)) {
        return configPath;
      }
      const absolutePath = join(testDir, configPath);
      if (existsSync(absolutePath)) {
        return absolutePath;
      }
      return null;
    };

    writeFileSync(join(testDir, "auth.ts"), "test");

    const relativePath = normalizePath("auth.ts");
    expect(relativePath).toBeTruthy();
    expect(relativePath).toContain("auth.ts");

    const absolutePath = normalizePath(join(testDir, "auth.ts"));
    expect(absolutePath).toBeTruthy();
    expect(absolutePath).toContain("auth.ts");
  });

  it("should get file display info correctly", () => {
    const { basename, relative } = require("path");

    const getFileDisplayInfo = (filePath: string) => {
      const absolutePath = isAbsolute(filePath) ? filePath : join(testDir, filePath);
      const relativePath = relative(testDir, absolutePath);

      return {
        absolutePath,
        fileName: basename(absolutePath),
        filePath: relativePath || absolutePath,
      };
    };

    writeFileSync(join(testDir, "auth.ts"), "test");

    const info = getFileDisplayInfo("auth.ts");
    expect(info.fileName).toBe("auth.ts");
    expect(info.absolutePath).toContain("auth.ts");
    expect(info.filePath).toBeTruthy();
  });
});
