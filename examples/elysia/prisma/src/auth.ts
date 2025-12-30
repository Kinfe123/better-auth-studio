import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, admin } from 'better-auth/plugins';
import prisma from './prisma';

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) => {
    console.log(`Sending email to ${to} | ${subject}`);
    if (text) console.log('Text content:', text);
    if (html) console.log('HTML content:', html);
};

export const auth = betterAuth({
    secret: process.env.AUTH_SECRET || 'better-auth-secret-123456789',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    baseURL,
    basePath: '/api/auth',
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            redirectURI: `${baseURL}/api/auth/callback/github`,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirectURI: `${baseURL}/api/auth/callback/google`,
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID || '',
            clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
            redirectURI: `${baseURL}/api/auth/callback/discord`,
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
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            console.log(`Verification email for ${user.email}: ${url}`);
        },
    },
    plugins: [
        organization({
            teams: {
                enabled: true,
            },
            sendInvitationEmail: async (data, request) => {
                console.log('sendInvitationEmail', data, request);
            },
        }),
        admin(),
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
    trustedOrigins: ['http://localhost:3002', 'http://localhost:3000'],
});

