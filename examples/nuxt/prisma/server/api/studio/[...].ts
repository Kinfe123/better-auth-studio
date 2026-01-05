import { createStudioHandler } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';

const handler = createStudioHandler(studioConfig);

export default defineEventHandler(async (event) => {
    console.log(event);
    return handler(event);
});

