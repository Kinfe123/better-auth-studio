import { betterAuthStudio } from 'better-auth-studio/astro';
import studioConfig from '../../../../studio.config';
import type { APIRoute } from 'astro';

const handler = betterAuthStudio(studioConfig);
export const ALL: APIRoute = async (ctx) => {
  return handler(ctx);
};

