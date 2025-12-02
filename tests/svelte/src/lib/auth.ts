import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../../auth-schema";
import { organization, admin, twoFactor, apiKey } from "better-auth/plugins";

export const auth = betterAuth({
    secret: process.env.AUTH_SECRET || "better-auth-secret-123456789",
    database: drizzleAdapter(db, {
        provider: "pg", schema: {
            user: schema.user,
            account: schema.account,
            session: schema.session,
            verification: schema.verification,
            invitation: schema.invitation,
            organization: schema.organization,
        }
    }),
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
    basePath: "/api/auth",
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
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
        admin(),
        twoFactor({}),
        apiKey(),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    rateLimit: {
        enabled: true,
        window: 10,
        max: 100,
    },
    telemetry: {
        enabled: false,
    },
    trustedOrigins: ["http://localhost:5173", "http://localhost:3000" , 'http://localhost:3002'],
});

