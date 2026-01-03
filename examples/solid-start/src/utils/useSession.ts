import { createServerData$ } from 'solid-start/server'
import { auth } from '~/lib/auth'

export const serverSession: Parameters<typeof createServerData$> = [
  async (_, { request }) => {
    return await auth.api.getSession({
      headers: request.headers,
    })
  },
  { key: () => ['auth_user'] },
]
