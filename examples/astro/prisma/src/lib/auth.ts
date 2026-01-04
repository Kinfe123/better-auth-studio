import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';

const baseURL = process.env.BETTER_AUTH_URL || process.env.BASE_URL || 'http://localhost:4321';

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  baseURL,
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`Reset password email for ${user.email}: ${url}`);
    },
    resetPasswordTokenExpiresIn: 3600,
  },
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
  trustedOrigins: [baseURL, 'http://localhost:4321', 'http://localhost:3002'],
});

