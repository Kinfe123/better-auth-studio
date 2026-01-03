import { isServer } from 'solid-js/web'
import { z } from 'zod'

export const serverScheme = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AUTH_SECRET: z.string(),
  DATABASE_URL: z.string(),
  START_BASE_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set START_BASE_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string() : z.string().url(),
  ),
  BETTER_AUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

export const clientScheme = z.object({
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  START_BASE_URL: z.string().optional().default('http://127.0.0.1:3000'),
})
