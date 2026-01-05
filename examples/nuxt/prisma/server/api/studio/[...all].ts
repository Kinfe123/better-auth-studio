import { betterAuthStudio } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';
const handler = betterAuthStudio(studioConfig);
export default defineEventHandler(async (event) => {
  const request = event.node.req as unknown as Request;
  return await handler(request)
});
