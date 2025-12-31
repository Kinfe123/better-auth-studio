import type { StudioConfig } from 'better-auth-studio';
import { auth } from '$lib/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Better Auth Studio',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ['kinfetare83@gmail.com'],
  },
};

export default config;

