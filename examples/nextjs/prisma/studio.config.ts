import type { StudioConfig } from 'better-auth-studio';
import { auth } from '@/lib/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Admin Dashboard',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ['admin@test.com', 'kinfetare83@someone.com'],
  },
};

export default config;
