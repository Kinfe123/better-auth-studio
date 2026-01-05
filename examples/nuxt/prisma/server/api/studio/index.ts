import { betterAuthStudio } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';
const handler = betterAuthStudio(studioConfig);
export default defineEventHandler(async (event) => {
  return handler(toWebRequest(event))
});
