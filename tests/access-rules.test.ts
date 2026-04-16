import { describe, expect, it } from "vitest";
import { evaluateRequestAccess, extractClientIp } from "../src/utils/access-rules";

describe("access rules", () => {
  it("extracts IP from x-forwarded-for", () => {
    const ip = extractClientIp({
      "x-forwarded-for": "203.0.113.2, 10.0.0.5",
    });
    expect(ip).toBe("203.0.113.2");
  });

  it("blocks exact IPs from blocklist", () => {
    const result = evaluateRequestAccess({
      path: "/api/auth/session",
      method: "GET",
      headers: {
        "x-forwarded-for": "203.0.113.2",
      },
      accessConfig: {
        blockIpAddresses: ["203.0.113.2"],
      },
    });

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("ip_blocked");
    }
  });

  it("enforces allowlist", () => {
    const result = evaluateRequestAccess({
      path: "/api/auth/session",
      method: "GET",
      headers: {
        "x-forwarded-for": "198.51.100.8",
      },
      accessConfig: {
        allowIpAddresses: ["10.0.*"],
      },
    });

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("ip_not_allowed");
    }
  });

  it("supports wildcard IP rules", () => {
    const result = evaluateRequestAccess({
      path: "/api/auth/session",
      method: "GET",
      headers: {
        "x-forwarded-for": "10.0.1.15",
      },
      accessConfig: {
        allowIpAddresses: ["10.0.*"],
      },
    });

    expect(result.allowed).toBe(true);
  });
});
