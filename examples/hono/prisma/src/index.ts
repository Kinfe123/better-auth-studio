import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { auth } from "./auth";
import { betterAuthStudio } from "better-auth-studio/hono";
import studioConfig from "../studio.config";

const app = new Hono();

// CORS configuration
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);
// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    message: "Better Auth Test Project Running",
    timestamp: new Date().toISOString(),
  });
});

// Better Auth Studio routes
app.on(["POST", "GET", "PUT", "DELETE"], "/api/studio/*", betterAuthStudio(studioConfig));

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Root endpoint
app.get("/", async (c) => {
  try {
    const sessionResponse = await auth.api.getSession({ headers: c.req.raw.headers });
    const recentAccounts = await (
      await auth.$context
    ).adapter.findMany({
      model: "account",
      where: [{ field: "providerId", value: "github" }],
      limit: 5,
    });
    const recentUsers = await (
      await auth.$context
    ).adapter.findMany({
      model: "user",
      limit: 5,
    });
    const sessions = await (
      await auth.$context
    ).adapter.findMany({
      model: "session",
      limit: 5,
    });
    return c.json({
      message: "Better Auth Test Project",
      description: "This is a test project for Better Auth Studio with Hono",
      sessions: JSON.stringify(sessions, null, 2),
      userCount: recentUsers.length,
      endpoints: {
        health: "/health",
        auth: "/api/auth/*",
        studio: "/api/studio/*",
      },
    });
  } catch (error) {
    console.error("Root route error:", error);
    return c.json(
      {
        error: "Failed to load data",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
app.get("/test", async (c) => {
  // const { success } = await auth.api.signInPhoneNumber({
  //   body: {

  //   }
  // })
  const result = await auth.api.sendPhoneNumberOTP({
    body: {
      phoneNumber: "+16502530001",
    },
  });
  // for normal password reset requeset
  // const result = await auth.api.requestPasswordReset({
  //   body: {
  //     email: "user@test.com",
  //   }
  // })
  return c.json({ message: "Test", result });
});
app.get("/test/phone", async (c) => {
  const result = await auth.api.verifyPhoneNumber({
    body: {
      phoneNumber: "+16502530001",
      code: "031316",
    },
  });
  return c.json({ message: "Test", result });
});
app.get("/test/reset", async (c) => {
  const token = c.req.query("token");
  const codeOtp = await prisma!.codeOtp.findMany();
  const { success } = await auth.api.resetPasswordEmailOTP({
    body: {
      email: "user@test.com",
      otp: "912210",
      password: "someonepassword",
    },
  });
  // for normal password reset
  // const result = await auth.api.resetPassword({
  //   body: {
  //     token: token,
  //     newPassword: "someonepassword"
  //   }
  // })
  return c.json({ message: "Test", success });
});
// Start server
const PORT = parseInt(process.env.PORT || "3000", 10);
serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`🚀 Better Auth Test Project running on http://localhost:${info.port}`);
  },
);
