import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import { db } from './lib/db';

const studioConfig: StudioConfig = {
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
  events: {
    enabled: true,
    client: db,
    clientType: 'drizzle',
    tableName: 'auth_events',
    liveMarquee: {
      enabled: true,
      pollInterval: 2000,
      speed: 1,
      sort: "desc",
      pauseOnHover: true,
      colors: {
        success: '#34d399',
        info: '#fcd34d',
        warning: '#facc15',
        error: '#f87171',
        failed: '#f87171',
      },
    },
  }
};

export default studioConfig;
