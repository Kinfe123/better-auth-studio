import { betterAuth } from "better-auth";
import { organization, twoFactor, admin, apiKey } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../lib/db";
import * as schema from "../auth-schema";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || "better-auth-secret-123456789",
  database: drizzleAdapter(db, { provider: "pg", schema: schema, usePlural: false }),
  baseURL,
  basePath: "/api/auth",
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectURI: `${baseURL}/api/auth/callback/github`
    }
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      console.log(`Reset password email for ${user.email}: ${url}`);
    },
    resetPasswordTokenExpiresIn: 3600 // 1 hour
  },
  plugins: [
    organization({
      teams: {
        enabled: true
      }
    }),
    admin(),
    twoFactor({}),
    apiKey()
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 45, // 45 days (testing WebSocket hot reload)
    updateAge: 60 * 60 * 24 // 1 day
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100
  },
  telemetry: {
    enabled: false
  }
});