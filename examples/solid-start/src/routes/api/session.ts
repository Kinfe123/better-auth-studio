import { ApiHandler } from 'solid-start/api/types'
import { auth } from '~/lib/auth'

export const GET: ApiHandler = async (event) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  })
  return new Response(JSON.stringify(session))
}
