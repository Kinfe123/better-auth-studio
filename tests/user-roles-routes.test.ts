import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthConfig } from "../src/config";
import { createRoutes } from "../src/routes";
import type { StudioRolesConfig } from "../src/types/handler";
import { createStudioSession, encryptSession, STUDIO_COOKIE_NAME } from "../src/utils/session";

const sessionSecret = "user-roles-route-test-secret";
const authConfig: AuthConfig = {
  database: { adapter: "memory", provider: "memory" },
};

function createUserRolesApp(userRoles?: StudioRolesConfig) {
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: "created-user",
    ...data,
  }));
  const update = vi.fn(async ({ update }: { update: Record<string, unknown> }) => update);
  const adapter = { create, update };
  const sessionCookie = encryptSession(
    createStudioSession({
      id: "reviewer",
      email: "reviewer@example.com",
      name: "Reviewer",
      role: "admin",
    }),
    sessionSecret,
  );
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).cookies = { [STUDIO_COOKIE_NAME]: sessionCookie };
    next();
  });
  app.use(
    createRoutes(
      authConfig,
      undefined,
      undefined,
      adapter,
      undefined,
      { secret: sessionSecret },
      undefined,
      userRoles === undefined ? { auth: {} } : { auth: {}, userRoles },
    ),
  );

  return { app, create, update };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("user role route enforcement", () => {
  it("preserves unrestricted user writes when userRoles is omitted", async () => {
    const { app, create, update } = createUserRolesApp();

    await request(app)
      .post("/api/users")
      .send({ name: "Ada", email: "ada@example.com", role: "CUSTOM_ADMIN" })
      .expect(200);
    await request(app)
      .put("/api/users/user-1")
      .send({ name: "Ada", email: "ada@example.com", role: "CUSTOM_EDITOR" })
      .expect(200);

    expect(create.mock.calls[0][0].data.role).toBe("CUSTOM_ADMIN");
    expect(update.mock.calls[0][0].update.role).toBe("CUSTOM_EDITOR");
  });

  it("accepts configured roles and rejects roles outside the vocabulary", async () => {
    const { app, create, update } = createUserRolesApp(["EDITOR"]);

    await request(app)
      .post("/api/users")
      .send({ name: "Ada", email: "ada@example.com", role: "ADMIN" })
      .expect(400);
    await request(app)
      .post("/api/users")
      .send({ name: "Ada", email: "ada@example.com", role: "EDITOR" })
      .expect(200);
    await request(app)
      .put("/api/users/user-1")
      .send({ name: "Ada", email: "ada@example.com", role: "ADMIN" })
      .expect(400);

    expect(create).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });

  it("distinguishes a configured mix role from random-role mode", async () => {
    const { app, create } = createUserRolesApp(["mix", "EDITOR"]);
    vi.spyOn(Math, "random").mockReturnValue(0.75);

    await request(app).post("/api/seed/users").send({ count: 1, role: "mix" }).expect(200);
    await request(app).post("/api/seed/users").send({ count: 1, roleMode: "mix" }).expect(200);

    expect(create.mock.calls[0][0].data.role).toBe("mix");
    expect(create.mock.calls[1][0].data.role).toBe("EDITOR");
  });

  it("keeps accepting the legacy mix sentinel when it cannot collide", async () => {
    const { app, create } = createUserRolesApp(["ADMIN", "EDITOR"]);
    vi.spyOn(Math, "random").mockReturnValue(0.75);

    await request(app).post("/api/seed/users").send({ count: 1, role: "mix" }).expect(200);

    expect(create.mock.calls[0][0].data.role).toBe("EDITOR");
  });
});
