import { betterAuthStudio } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';

export default defineEventHandler((event) => {
  const toWeb = toWebRequest(event);
  return betterAuthStudio(studioConfig)(toWebRequest(event));
});

