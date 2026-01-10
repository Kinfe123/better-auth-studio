import type { StudioConfig } from 'better-auth-studio';
import { auth } from '@/lib/auth';

const config: StudioConfig = {
  auth,
  basePath: '/dashboard',
  metadata: {
    title: 'Acme Admin Dashboard',
    theme: 'dark',
    logo: 'https://better-auth.com/logo.png',
    favicon: 'https://better-auth.com/favicon.png',
    company: {
      name: 'Better-Auth',
      website: 'https://better-auth.com',
    },
  },
  access: {
    roles: ['admin'],
    allowEmails: ["kinfetare83@gmail.com"],
  },
};

export default config;
