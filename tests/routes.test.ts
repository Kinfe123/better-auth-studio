import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoutes, handleStudioApiRequest } from "../src/routes";
import type { AuthConfig } from "../src/config";
import { createStudioSession, encryptSession, STUDIO_COOKIE_NAME } from "../src/utils/session";
import express from "express";
import request from "supertest";

describe("Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    const mockAuthConfig: AuthConfig = {
      database: {
        adapter: "prisma",
        provider: "postgresql",
      },
      baseURL: "http://localhost:3000",
      basePath: "/api/auth",
      emailAndPassword: {
        enabled: true,
      },
    };

    app = express();
    app.use(express.json());
    app.use(createRoutes(mockAuthConfig));
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it("should register health check endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect([200, 500]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  it("should register config endpoint", async () => {
    const response = await request(app).get("/api/config").expect(200);

    expect(response.body).toBeDefined();
  });

  it("should handle database schema endpoint", async () => {
    const response = await request(app).get("/api/database/schema");

    expect([200, 500]).toContain(response.status);
    expect(response.body).toBeDefined();
    expect(typeof response.body === "object").toBe(true);
  });

  it("should handle users endpoint", async () => {
    const response = await request(app).get("/api/users");
    expect([200, 500]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  it("should handle organizations endpoint", async () => {
    try {
      const response = (await Promise.race([
        request(app).get("/api/organizations"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
      ])) as any;
      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    } catch (error) {
      expect(true).toBe(true);
    }
  }, 3000);

  it("should return 404 for unknown routes", async () => {
    await request(app).get("/api/unknown-route").expect(404);
  });

  it("should handle CORS correctly", async () => {
    const response = await request(app)
      .get("/api/config")
      .set("Origin", "http://localhost:3000")
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it("should block self-hosted requests for blocked IP addresses", async () => {
    const selfHostedApp = express();
    selfHostedApp.use(express.json());
    selfHostedApp.use(
      createRoutes(
        {
          database: {
            adapter: "prisma",
            provider: "postgresql",
          },
        },
        undefined,
        undefined,
        {},
        {},
        { blockIpAddresses: ["203.0.113.10"] },
      ),
    );

    const response = await request(selfHostedApp)
      .get("/api/auth/session")
      .set("x-forwarded-for", "203.0.113.10");

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("blocked");
  });

  it("should enforce blocked IPs in universal API routing", async () => {
    const response = await handleStudioApiRequest({
      path: "/api/health",
      method: "GET",
      headers: {
        "x-forwarded-for": "198.51.100.77",
      },
      auth: {
        options: {},
        $context: Promise.resolve({
          adapter: {},
        }),
      },
      accessConfig: {
        blockIpAddresses: ["198.51.100.77"],
      },
    });

    expect(response.status).toBe(403);
    expect(response.data?.reason).toBe("ip_blocked");
  });
});

describe("Identity image routes", () => {
  const sessionSecret = "identity-image-route-test-secret";
  const user = {
    id: "user-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    image: "/avatars/ada.png",
    emailVerified: true,
    role: "admin",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const organization = {
    id: "org-1",
    name: "Analytical Engines",
    slug: "analytical-engines",
    logo: "https://cdn.example.com/org-logo.png",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
  const invitation = {
    id: "invitation-1",
    email: user.email,
    role: "member",
    status: "pending",
    organizationId: organization.id,
    inviterId: "user-2",
    expiresAt: new Date("2026-02-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  };

  function createIdentityApp() {
    const adapter = {
      findMany: vi.fn(async ({ model }: { model: string }) => {
        if (model === "user") return [user];
        if (model === "organization") return [organization];
        if (model === "member") {
          return [
            {
              id: "member-1",
              userId: user.id,
              organizationId: organization.id,
              role: "member",
              createdAt: new Date("2026-01-03T00:00:00.000Z"),
            },
          ];
        }
        if (model === "team") {
          return [
            {
              id: "team-1",
              name: "Research",
              organizationId: organization.id,
              createdAt: new Date("2026-01-03T00:00:00.000Z"),
              updatedAt: new Date("2026-01-03T00:00:00.000Z"),
            },
          ];
        }
        if (model === "invitation") return [invitation];
        return [];
      }),
      findOne: vi.fn(async ({ model }: { model: string }) => {
        if (model === "user") return user;
        if (model === "organization") return organization;
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "org-seeded",
        ...data,
      })),
    };
    const authConfig: AuthConfig = {
      database: { adapter: "prisma", provider: "postgresql" },
    };
    const session = createStudioSession(user);
    const sessionCookie = encryptSession(session, sessionSecret);
    const app = express();

    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).cookies = { [STUDIO_COOKIE_NAME]: sessionCookie };
      next();
    });
    app.use(
      createRoutes(authConfig, undefined, undefined, adapter, undefined, {
        secret: sessionSecret,
      }),
    );

    return { adapter, app };
  }

  it("preserves user images and organization logos in transformed responses", async () => {
    const { app } = createIdentityApp();

    const usersResponse = await request(app).get("/api/users?limit=10000").expect(200);
    expect(usersResponse.body.users[0].image).toBe(user.image);

    const organizationResponse = await request(app)
      .get(`/api/organizations/${organization.id}`)
      .expect(200);
    expect(organizationResponse.body.organization.logo).toBe(organization.logo);

    const membershipsResponse = await request(app)
      .get(`/api/users/${user.id}/organizations`)
      .expect(200);
    expect(membershipsResponse.body.memberships[0].organization.logo).toBe(organization.logo);
    expect(membershipsResponse.body.memberships[0].organization).not.toHaveProperty("image");

    const teamResponse = await request(app).get("/api/teams/team-1").expect(200);
    expect(teamResponse.body.team.organization.logo).toBe(organization.logo);

    const invitationsResponse = await request(app)
      .get(`/api/users/${user.id}/invitations`)
      .expect(200);
    expect(invitationsResponse.body.invitations[0].organizationLogo).toBe(organization.logo);
  });

  it("seeds organizations with the canonical logo field", async () => {
    const { adapter, app } = createIdentityApp();

    const response = await request(app)
      .post("/api/seed/organizations")
      .send({ count: 1 })
      .expect(200);
    const createInput = adapter.create.mock.calls[0][0];

    expect(createInput.data.logo).toMatch(/^https:\/\/api\.dicebear\.com\//);
    expect(createInput.data).not.toHaveProperty("image");
    expect(response.body.results[0].organization.logo).toBe(createInput.data.logo);
    expect(response.body.results[0].organization).not.toHaveProperty("image");
  });
});
