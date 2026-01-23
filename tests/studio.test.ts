import { describe, it, expect, afterEach } from "vitest";
import { startStudio } from "../src/studio";
import type { AuthConfig } from "../src/config";

describe("Studio", () => {
  let testServer: any = null;

  afterEach(async () => {
    if (testServer && typeof testServer.close === "function") {
      await new Promise<void>((resolve) => {
        testServer.close(() => resolve());
      });
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
});
