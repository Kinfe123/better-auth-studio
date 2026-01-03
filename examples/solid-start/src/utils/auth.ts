import { authClient } from '~/lib/auth-client'

export const useSession = () => authClient.useSession()

export const session = () => {
  const sessionData = useSession()
  return sessionData()?.data ?? null
}
