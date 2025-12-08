import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization, admin } from 'better-auth/plugins';
import { prisma } from './db';
export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || 'better-auth-secret-123456789',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
    resetPasswordTokenExpiresIn: 3600,
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
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  telemetry: {
    enabled: false,
  },
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3002'],
});

