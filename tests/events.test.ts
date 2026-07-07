import { describe, it, expect, vi } from "vitest";
import { createPostgresProvider } from "../src/providers/events/helpers";
import type { AuthEvent } from "../src/types/events";

describe("Event providers", () => {
  it("supports Kysely clients for Postgres event ingestion", async () => {
    const executeQuery = vi.fn(async (compiledQuery: { sql: string; parameters: unknown[] }) => {
      if (compiledQuery.sql.includes("SELECT EXISTS")) {
        return { rows: [{ exists: true }] };
      }

      return { rows: [] };
    });

    const client = {
      selectFrom: vi.fn(),
      executeQuery,
    };

    const provider = createPostgresProvider({
      client,
      clientType: "kysely",
    });

    const event: AuthEvent = {
      id: "4b5944af-7e28-4e8e-9f77-60fc43798679",
      type: "user.logged_in",
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
      status: "success",
      userId: "user-1",
      sessionId: "session-1",
      organizationId: "org-1",
      metadata: { provider: "github" },
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      source: "app",
      display: {
        message: "Signed in",
        severity: "info",
      },
    };

    await provider.ingest(event);

    const insertCall = executeQuery.mock.calls.find(([compiledQuery]) =>
      compiledQuery.sql.includes("INSERT INTO public.auth_events"),
    );

    expect(insertCall).toBeDefined();
    expect(insertCall?.[0].parameters).toEqual([
      event.id,
      event.type,
      event.timestamp,
      event.status,
      event.userId,
      event.sessionId,
      event.organizationId,
      JSON.stringify(event.metadata),
      event.ipAddress,
      event.userAgent,
      event.source,
      event.display?.message,
      event.display?.severity,
    ]);
  });
});
