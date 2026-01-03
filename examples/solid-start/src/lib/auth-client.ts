import { createAuthClient } from 'better-auth/solid'
import { clientEnv } from '~/env/client'

export const authClient = createAuthClient({
  baseURL: clientEnv.START_BASE_URL,
})

