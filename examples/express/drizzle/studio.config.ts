import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Admin Dashboard',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ['admin@test.com', 'kinfetare83@gmail.com'],
  },
};

export default config;
