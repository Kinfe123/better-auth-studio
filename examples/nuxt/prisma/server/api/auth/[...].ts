import { auth } from '~/server/lib/auth';
import { toNodeHandler } from 'better-auth/node';

export default defineEventHandler(async (event) => {
  return toNodeHandler(auth)(event.node.req, event.node.res);
});

