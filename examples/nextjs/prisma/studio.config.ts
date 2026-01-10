import type { StudioConfig } from 'better-auth-studio';
import { auth } from '@/lib/auth';

const config: StudioConfig = {
  auth,
  basePath: '/dashboard',
  metadata: {
    title: 'Acme Admin Dashboard',
    theme: 'dark',
  },
  access: {
    roles: ['admin'],
    allowEmails: ["kinfetare83@gmail.com"],
  },
};

export default config;
