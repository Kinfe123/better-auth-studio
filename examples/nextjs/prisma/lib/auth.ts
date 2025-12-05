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
  hooks: {
    after: async (inputContext) => {
      console.log('after', inputContext);
    },
    before: async (inputContext) => {
      console.log('before', inputContext);
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account, context) => {
          console.log('after account create', account, context);
        },
        before: async (account, context) => {
          console.log('before account create', account, context);
        },
      },
      delete: {
        after: async (account, context) => {
          console.log('after account delete', account, context);
        },
        before: async (account, context) => {
          console.log('before account delete', account, context);
        },
      },
      update: {
        after: async (account, context) => {
          console.log('after account update', account, context);
        },
        before: async (account, context) => {
          console.log('before account update', account, context);
        },
      },
    },
    session: {
      create: {
        after: async (session, context) => {
          console.log('after session create', session, context);
        },
        before: async (session, context) => {
          console.log('before session create', session, context);
        },
      },
      delete: {

      },
      update: {
        after: async (session, context) => {
          console.log('after session update', session, context);
        },
        before: async (session, context) => {
          console.log('before session update', session, context);
        },
      },
    },
    user: {
      create: {
        after: async (user, context) => {
          console.log('after user create', user, context);
        },
        before: async (user, context) => {
          console.log('before user create', user, context);
        },
      },
      delete: {
        after: async (user, context) => {
          console.log('after user delete', user, context);
        },
        before: async (user, context) => {    
          console.log('before user delete', user, context);
        },
      },
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
    resetPasswordTokenExpiresIn: 3600,
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
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

