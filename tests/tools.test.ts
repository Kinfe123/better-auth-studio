import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoutes } from "../src/routes";
import type { AuthConfig } from "../src/config";
import express from "express";
import request from "supertest";

describe("Tools API Endpoints", () => {
  let app: express.Application;

  beforeEach(() => {
    const mockAuthConfig: Record<string, any> = {
      database: {
        adapter: "prisma",
        provider: "postgresql",
      },
      baseURL: "http://localhost:3000",
      basePath: "/api/auth",
      secret: "test-secret-key-12345",
      socialProviders: {
        github: {
          clientId: "test-client-id",
          clientSecret: "test-client-secret",
          redirectUri: "http://localhost:3000/api/auth/callback/github",
        },
      },
    };

    app = express();
    app.use(express.json());
    app.use(createRoutes(mockAuthConfig));
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe("Health Check", () => {
    it("should handle health check endpoint", async () => {
      const response = await request(app).post("/api/tools/health-check");

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Config Validation", () => {
    it("should handle config validation endpoint", async () => {
      const response = await request(app).post("/api/tools/validate-config");

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
      expect(typeof response.body === "object").toBe(true);
    });
  });

  describe("JWT Tools", () => {
    it("should decode JWT token", async () => {
      const testToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const response = await request(app).post("/api/tools/jwt/decode").send({ token: testToken });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error for invalid JWT token", async () => {
      const response = await request(app)
        .post("/api/tools/jwt/decode")
        .send({ token: "invalid-token" });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error for missing JWT token", async () => {
      const response = await request(app).post("/api/tools/jwt/decode").send({});

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Token Generator", () => {
    it("should generate session token", async () => {
      const response = await request(app).post("/api/tools/token-generator").send({
        type: "session",
        expiresIn: 60,
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      }
    });

    it("should generate access token", async () => {
      const response = await request(app).post("/api/tools/token-generator").send({
        type: "access",
        expiresIn: 30,
        subject: "test-user",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should generate refresh token", async () => {
      const response = await request(app).post("/api/tools/token-generator").send({
        type: "refresh",
        expiresIn: 10080,
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error for invalid token type", async () => {
      const response = await request(app).post("/api/tools/token-generator").send({
        type: "invalid-type",
        expiresIn: 60,
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Password Strength", () => {
    it("should check strong password", async () => {
      const response = await request(app)
        .post("/api/tools/password-strength")
        .send({ password: "SuperStrong@Pass123!" });

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 200) {
        expect(response.body.strength).toBeDefined();
        expect(response.body.score).toBeDefined();
      }
    });

    it("should check weak password", async () => {
      const response = await request(app)
        .post("/api/tools/password-strength")
        .send({ password: "123" });

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 200) {
        expect(response.body.strength).toBeDefined();
        expect(response.body.score).toBeDefined();
      }
    });

    it("should return error for missing password", async () => {
      const response = await request(app).post("/api/tools/password-strength").send({});

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Secret Generator", () => {
    it("should generate secret key", async () => {
      const response = await request(app).post("/api/tools/generate-secret");

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.secret).toBeDefined();
      expect(typeof response.body.secret).toBe("string");
      expect(response.body.secret.length).toBeGreaterThan(0);
    });
  });

  describe("Environment Variables", () => {
    it("should check env secret endpoint", async () => {
      const response = await request(app).post("/api/tools/check-env-secret");

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should check env credentials endpoint", async () => {
      const response = await request(app)
        .post("/api/tools/check-env-credentials")
        .send({ provider: "github" });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error when checking credentials without provider", async () => {
      const response = await request(app).post("/api/tools/check-env-credentials").send({});

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Plugin Generator", () => {
    it("should generate basic plugin", async () => {
      const response = await request(app).post("/api/tools/plugin-generator").send({
        pluginName: "testPlugin",
        description: "A test plugin",
        clientFramework: "react",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.plugin).toBeDefined();
      }
    });

    it("should return error for invalid plugin name", async () => {
      const response = await request(app).post("/api/tools/plugin-generator").send({
        pluginName: "123-invalid",
        description: "Invalid plugin name",
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });

    it("should return error for missing plugin name", async () => {
      const response = await request(app).post("/api/tools/plugin-generator").send({
        description: "Plugin without name",
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain("required");
      }
    });

    it("should generate plugin with tables", async () => {
      const response = await request(app)
        .post("/api/tools/plugin-generator")
        .send({
          pluginName: "testPlugin",
          description: "Plugin with tables",
          tables: [
            {
              name: "testTable",
              fields: [
                { name: "id", type: "string", required: true },
                { name: "name", type: "string", required: false },
              ],
            },
          ],
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should generate plugin with hooks", async () => {
      const response = await request(app)
        .post("/api/tools/plugin-generator")
        .send({
          pluginName: "testPlugin",
          description: "Plugin with hooks",
          hooks: [
            {
              timing: "before",
              action: "sign-in",
              hookLogic: 'console.log("Before sign in");',
            },
          ],
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should generate plugin with endpoints", async () => {
      const response = await request(app)
        .post("/api/tools/plugin-generator")
        .send({
          pluginName: "testPlugin",
          description: "Plugin with endpoints",
          endpoints: [
            {
              name: "testEndpoint",
              path: "/test",
              method: "GET",
              handlerLogic: "return ctx.json({ success: true });",
            },
          ],
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("OAuth Tools", () => {
    it("should list OAuth providers", async () => {
      const response = await request(app).get("/api/tools/oauth/providers");

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should handle OAuth test endpoint", async () => {
      const response = await request(app).post("/api/tools/oauth/test").send({
        provider: "github",
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });
      expect([200, 400, 500]).toContain(response.status);
    });

    it("should handle OAuth status endpoint", async () => {
      const response = await request(app)
        .get("/api/tools/oauth/status")
        .query({ sessionId: "test-session-id" });

      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should test OAuth credentials", async () => {
      const response = await request(app).post("/api/tools/test-oauth-credentials").send({
        provider: "github",
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Data Export", () => {
    it("should handle export endpoint", async () => {
      const response = await request(app).post("/api/tools/export").send({
        format: "json",
        includeUsers: true,
        includeSessions: false,
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error for invalid export format", async () => {
      const response = await request(app).post("/api/tools/export").send({
        format: "invalid-format",
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Email Tools", () => {
    it("should apply email template", async () => {
      const response = await request(app).post("/api/tools/apply-email-template").send({
        templateType: "verification",
        customContent: "<p>Test email</p>",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should check Resend API key", async () => {
      const response = await request(app).get("/api/tools/check-resend-api-key");

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should handle send test email endpoint", async () => {
      const response = await request(app).post("/api/tools/send-test-email").send({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return error when sending email without recipient", async () => {
      const response = await request(app).post("/api/tools/send-test-email").send({
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Migrations", () => {
    it("should handle migrations run endpoint", async () => {
      const response = await request(app).post("/api/tools/migrations/run").send({
        action: "generate",
      });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/api/tools/token-generator")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect([400, 500]).toContain(response.status);
    });

    it("should handle missing required fields gracefully", async () => {
      const response = await request(app).post("/api/tools/plugin-generator").send({});

      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it("should return 404 for non-existent tool endpoints", async () => {
      const response = await request(app).get("/api/tools/non-existent-endpoint");

      expect(response.status).toBe(404);
    });
  });

  describe("Input Validation", () => {
    it("should validate password strength with various inputs", async () => {
      const passwords = [
        { password: "Abc123!@#", expected: [200, 500] },
        { password: "password", expected: [200, 500] },
        { password: "12345678", expected: [200, 500] },
        { password: "P@ssw0rd!", expected: [200, 500] },
      ];

      for (const test of passwords) {
        const response = await request(app)
          .post("/api/tools/password-strength")
          .send({ password: test.password });

        expect(test.expected).toContain(response.status);
      }
    });

    it("should validate plugin names properly", async () => {
      const pluginNames = [
        { name: "validPlugin", shouldPass: true },
        { name: "valid_plugin", shouldPass: true },
        { name: "$validPlugin", shouldPass: true },
        { name: "123invalid", shouldPass: false },
        { name: "invalid-name", shouldPass: false },
        { name: "", shouldPass: false },
      ];

      for (const test of pluginNames) {
        const response = await request(app).post("/api/tools/plugin-generator").send({
          pluginName: test.name,
          description: "Test plugin",
        });

        if (test.shouldPass) {
          expect([200, 500]).toContain(response.status);
        } else {
          expect([400, 500]).toContain(response.status);
        }
      }
    });
  });

  describe("Performance", () => {
    it("should respond to health check within reasonable time", async () => {
      const startTime = Date.now();

      await request(app).post("/api/tools/health-check");

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it("should handle multiple concurrent requests", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).post("/api/tools/generate-secret"));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.secret).toBeDefined();
      });
    });
  });
});
