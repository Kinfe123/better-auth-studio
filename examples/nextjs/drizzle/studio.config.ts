import type { StudioConfig } from 'better-auth-studio';
import { auth } from '@/lib/auth';
import { db } from './lib/db';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Admin Dashboard',
    theme: 'dark',
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

export default config;
