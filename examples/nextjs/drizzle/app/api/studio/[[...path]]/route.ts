import { createStudioHandler } from 'better-auth-studio/nextjs';
import studioConfig from '@/studio.config';

const handler = createStudioHandler(studioConfig);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
