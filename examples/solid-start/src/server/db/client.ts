import { PrismaClient } from '@prisma/client'
import { serverEnv } from '~/env/server'

export const prisma = new PrismaClient({
  log: serverEnv.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
