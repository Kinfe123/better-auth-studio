import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Better Auth Studio',
    theme: 'dark',
  },
};

export default config;

