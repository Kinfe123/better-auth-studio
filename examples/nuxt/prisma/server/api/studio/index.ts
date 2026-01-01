import { createStudioHandler } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';

const handler = createStudioHandler(studioConfig);

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    try {
      const body = await readBody(event);
      event._requestBody = body;
    } catch (error) {
      if ((error as any)?.code !== 'EPIPE') {
        throw error;
      }
    }
  }
  return handler(event);
});

