import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { admin, apiKey, organization, phoneNumber, twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../../lib/db";
import * as schema from "../../../auth-schema";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || "better-auth-secret-123456789",
  database: drizzleAdapter(db, { provider: "pg", schema: schema }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/api/auth/callback/github"
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
      // Send reset password email
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
    twoFactor({}),
    admin(),
    apiKey(),
    phoneNumber()
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // 1 day
  },
  rateLimit: {
    enabled: true,
    window: 14,
    max: 100
  },
  telemetry: {
    enabled: false
  }
});