import type { StudioConfig } from 'better-auth-studio';
import { auth } from './app/lib/auth.server';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Better Auth Studio',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ['kinfetare8@gmail.com'],
  },
};

export default config;

