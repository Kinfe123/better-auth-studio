import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import type { PrismaClient } from "./generated/prisma/client";
import type { Env } from "./env";
import { csv } from "./env";

const DEFAULT_SECRET = "better-auth-studio-cloudflare-workers-secret";

export function createAuth(prisma: PrismaClient, env: Env, request: Request) {
  const origin = new URL(request.url).origin;
  const baseURL = env.BETTER_AUTH_URL || origin;

  return betterAuth({
    secret: env.AUTH_SECRET || DEFAULT_SECRET,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    plugins: [
      organization({
        teams: {
          enabled: true,
        },
      }),
      admin({
        adminUserIds: csv(env.ADMIN_USER_IDS),
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      window: 10,
      max: 100,
    },
    trustedOrigins: Array.from(new Set([origin, baseURL])),
    telemetry: {
      enabled: false,
    },
  });
}
