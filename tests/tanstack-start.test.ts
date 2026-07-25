import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UniversalRequest } from "../src/types/handler";

const handleStudioRequest = vi.fn();

vi.mock("../src/core/handler.js", () => ({
  handleStudioRequest,
}));

vi.mock("../src/utils/hook-injector.js", () => ({
  injectEventHooks: vi.fn(),
  injectLastSeenAtHooks: vi.fn(),
}));

const { betterAuthStudio } = await import("../src/adapters/tanstack-start");

describe("TanStack Start adapter", () => {
  beforeEach(() => {
    handleStudioRequest.mockReset();
  });

  it("routes static assets through the exact studio route", async () => {
    handleStudioRequest.mockResolvedValue({
      status: 200,
      headers: { "Content-Type": "text/html" },
      body: [
        '<script src="/api/studio/assets/main.js"></script>',
        '<link href="/api/studio/assets/main.css" rel="stylesheet">',
        '<link href="/api/studio/logo.png" rel="icon">',
      ].join(""),
    });

    const handler = betterAuthStudio({ auth: {}, basePath: "/api/studio" });
    const response = await handler({
      request: new Request("http://localhost:3000/api/studio"),
    });
    const html = await response.text();

    expect(html).toContain("/api/studio?__better_auth_studio_asset=%2Fassets%2Fmain.js");
    expect(html).toContain("/api/studio?__better_auth_studio_asset=%2Fassets%2Fmain.css");
    expect(html).toContain("/api/studio?__better_auth_studio_asset=%2Flogo.png");
  });

  it("converts a static asset query back to its public file path", async () => {
    handleStudioRequest.mockResolvedValue({
      status: 200,
      headers: { "Content-Type": "text/css" },
      body: "body{}",
    });

    const handler = betterAuthStudio({ auth: {}, basePath: "/api/studio" });
    await handler({
      request: new Request(
        "http://localhost:3000/api/studio?__better_auth_studio_asset=%2Fassets%2Fmain.css",
      ),
    });

    expect(handleStudioRequest).toHaveBeenCalledOnce();
    const request = handleStudioRequest.mock.calls[0][0] as UniversalRequest;
    expect(request.url).toBe("/assets/main.css");
  });

  it("does not accept arbitrary paths through the asset query", async () => {
    handleStudioRequest.mockResolvedValue({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const handler = betterAuthStudio({ auth: {}, basePath: "/api/studio" });
    await handler({
      request: new Request(
        "http://localhost:3000/api/studio?__better_auth_studio_asset=%2Fapi%2Fusers",
      ),
    });

    const request = handleStudioRequest.mock.calls[0][0] as UniversalRequest;
    expect(request.url).toBe("/");
  });
});
