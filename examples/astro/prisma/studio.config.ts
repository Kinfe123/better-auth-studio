import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/lib/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Better Auth Studio',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ['admin@example.com'],
  },
};

export default config;

