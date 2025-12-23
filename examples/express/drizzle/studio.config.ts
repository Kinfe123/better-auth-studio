import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Admin Dashboard',
    theme: 'dark',
  },
};

export default config;
