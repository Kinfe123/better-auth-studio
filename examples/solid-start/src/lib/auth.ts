import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization, admin } from 'better-auth/plugins'
import { prisma } from '~/server/db/client'
import { serverEnv } from '~/env/server'

export const auth = betterAuth({
  secret: serverEnv.AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: serverEnv.BETTER_AUTH_URL || serverEnv.START_BASE_URL,
  basePath: '/api/auth',
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID || '',
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET || '',
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
      console.log(`Reset password email for ${user.email}: ${url}`)
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
      },
      sendInvitationEmail: async (data, request) => {
        console.log('sendInvitationEmail', data, request)
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
  trustedOrigins: [serverEnv.START_BASE_URL, 'http://localhost:3000', 'http://localhost:3002'],
})

