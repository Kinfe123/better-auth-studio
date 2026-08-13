import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startStudio } from "../src/studio";
import type { AuthConfig } from "../src/config";

describe("Studio", () => {
  let testServer: any = null;
  let testDirectory: string | null = null;

  afterEach(async () => {
    if (testServer && typeof testServer.close === "function") {
      await new Promise<void>((resolve) => {
        testServer.close(() => resolve());
      });
    }
    testServer = null;
    vi.restoreAllMocks();
    if (testDirectory) {
      rmSync(testDirectory, { recursive: true, force: true });
      testDirectory = null;
    }
  });

  it("should start studio server successfully", async () => {
    const mockAuthConfig: AuthConfig = {
      database: {
        adapter: "prisma",
        provider: "postgresql",
      },
    };

    const result = await startStudio({
      port: 0, // Use random port
      host: "localhost",
      openBrowser: false,
      authConfig: mockAuthConfig,
      logStartup: false,
    });

    expect(result).toBeDefined();
    expect(result.server).toBeDefined();
    expect(typeof result.server.close).toBe("function");

    testServer = result.server;
  });

  it("should start studio with watch mode", async () => {
    const mockAuthConfig: AuthConfig = {
      database: {
        adapter: "drizzle",
        provider: "pg",
      },
    };

    const result = await startStudio({
      port: 0,
      host: "localhost",
      openBrowser: false,
      authConfig: mockAuthConfig,
      watchMode: true,
      logStartup: false,
    });

    expect(result).toBeDefined();
    expect(result.server).toBeDefined();
    expect(result.wss).toBeDefined(); // WebSocket server should exist in watch mode

    testServer = result.server;
  });

  it("should start studio without watch mode", async () => {
    const mockAuthConfig: AuthConfig = {
      database: {
        adapter: "prisma",
      },
    };

    const result = await startStudio({
      port: 0,
      host: "localhost",
      openBrowser: false,
      authConfig: mockAuthConfig,
      watchMode: false,
      logStartup: false,
    });

    expect(result).toBeDefined();
    expect(result.server).toBeDefined();
    expect(result.wss).toBeNull(); // No WebSocket server in non-watch mode

    testServer = result.server;
  });

  it("should handle onWatchConnection callback", async () => {
    const mockAuthConfig: AuthConfig = {
      database: {
        adapter: "prisma",
      },
    };

    let connectionCallbackCalled = false;

    const result = await startStudio({
      port: 0,
      host: "localhost",
      openBrowser: false,
      authConfig: mockAuthConfig,
      watchMode: true,
      onWatchConnection: () => {
        connectionCallbackCalled = true;
      },
      logStartup: false,
    });

    expect(result).toBeDefined();
    expect(result.wss).toBeDefined();

    testServer = result.server;
  });

  it("loads userRoles into the standalone CLI frontend", async () => {
    testDirectory = mkdtempSync(join(tmpdir(), "better-auth-studio-roles-"));
    writeFileSync(
      join(testDirectory, "studio.config.mjs"),
      `export default { userRoles: [{ value: "EDITOR", label: "Editor" }] };`,
    );
    vi.spyOn(process, "cwd").mockReturnValue(testDirectory);

    const result = await startStudio({
      port: 0,
      host: "127.0.0.1",
      openBrowser: false,
      authConfig: { database: { adapter: "memory", provider: "memory" } },
      logStartup: false,
    });
    testServer = result.server;
    if (!testServer.listening) {
      await new Promise<void>((resolve) => testServer.once("listening", resolve));
    }

    const address = testServer.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('"userRoles":[{"value":"EDITOR","label":"Editor"}]');
  });
});
