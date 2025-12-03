import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, organization } from "better-auth/plugins";
import mongodb from "./db";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: mongodbAdapter(mongodb),
  baseURL,
  basePath: "/api/auth",
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: `${baseURL}/api/auth/callback/github`
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${baseURL}/api/auth/callback/google`
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      redirectURI: `${baseURL}/api/auth/callback/discord`
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
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
      },
    }),
    admin()
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  telemetry: {
    enabled: false,
  },
  trustedOrigins: ["http://localhost:3002", "http://localhost:3000"],
});

