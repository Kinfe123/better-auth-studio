import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthConfig } from "../src/config";
import { getAuthData } from "../src/data";
import { handleStudioApiRequest } from "../src/routes";

const authConfig = {} as AuthConfig;

describe("session data", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("preserves canonical session metadata returned by getSessions", async () => {
    const session = {
      id: "session-1",
      userId: "user-1",
      token: "token-1",
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15",
      ipAddress: "203.0.113.10",
      customSessionField: "preserved",
    };
    const getSessions = vi.fn().mockResolvedValue([session]);

    const result = await getAuthData(authConfig, "sessions", { page: 1, limit: 20 }, undefined, {
      getSessions,
    });

    expect(getSessions).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject(session);
    expect(result.data[0].userAgent).toBe(session.userAgent);
    expect(result.data[0].ipAddress).toBe(session.ipAddress);
    expect(result.data[0].createdAt).toBe(session.createdAt);
    expect(result.data[0].expiresAt).toBe(session.expiresAt);
  });

  it("loads self-hosted sessions through findMany and normalizes snake_case fields", async () => {
    const androidUserAgent =
      "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro Build/AP3A.241105.008) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36";
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "session-1",
        user_id: "user-1",
        session_token: "token-1",
        expires_at: "2026-08-01T00:00:00.000Z",
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:00.000Z",
        user_agent: androidUserAgent,
        ip_address: "198.51.100.22",
        active_organization_id: "organization-1",
        active_team_id: "team-1",
      },
      {
        id: "session-2",
        user_id: "user-2",
        expires_at: "2026-09-01T00:00:00.000Z",
        created_at: "2026-07-03T00:00:00.000Z",
      },
    ]);

    const result = await getAuthData(authConfig, "sessions", { page: 1, limit: 1 }, undefined, {
      findMany,
    });

    expect(findMany).toHaveBeenCalledWith({ model: "session", limit: 100000 });
    expect(result).toMatchObject({ total: 2, page: 1, limit: 1, totalPages: 2 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: "session-1",
      userId: "user-1",
      token: "token-1",
      expiresAt: "2026-08-01T00:00:00.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z",
      userAgent: androidUserAgent,
      ipAddress: "198.51.100.22",
      activeOrganizationId: "organization-1",
      activeTeamId: "team-1",
      user_agent: androidUserAgent,
      ip_address: "198.51.100.22",
    });
  });

  it("serializes the session collection with the public sessions response key", async () => {
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15";
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-02T00:00:00.000Z",
        userAgent,
      },
    ]);

    const response = await handleStudioApiRequest({
      path: "/api/sessions?page=1&limit=20",
      method: "GET",
      headers: {},
      auth: {
        options: {},
        $context: Promise.resolve({ adapter: { findMany } }),
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      sessions: [{ id: "session-1", userId: "user-1", userAgent }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(response.data.data).toBeUndefined();
  });

  it("preserves device metadata for a user's snake_case sessions", async () => {
    const userAgent =
      "Mozilla/5.0 (Linux; Android 14; SM-X910 Build/UP1A.231005.007) AppleWebKit/537.36 Chrome/132.0 Safari/537.36";
    const findMany = vi.fn().mockResolvedValue([
      {
        session_id: "session-1",
        user_id: "user-1",
        session_token: "token-1",
        expires_at: "2026-08-01T00:00:00.000Z",
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:00.000Z",
        user_agent: userAgent,
        ip_address: "198.51.100.22",
      },
      {
        session_id: "session-2",
        user_id: "user-2",
        expires_at: "2026-08-01T00:00:00.000Z",
        created_at: "2026-07-01T00:00:00.000Z",
      },
    ]);

    const response = await handleStudioApiRequest({
      path: "/api/users/user-1/sessions",
      method: "GET",
      headers: {},
      auth: {
        options: {},
        $context: Promise.resolve({ adapter: { findMany } }),
      },
    });

    expect(response.status).toBe(200);
    expect(response.data.sessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        token: "token-1",
        userAgent,
        ipAddress: "198.51.100.22",
      }),
    ]);
  });
});
