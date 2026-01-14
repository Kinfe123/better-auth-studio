import type { StudioConfig } from 'better-auth-studio';
import { auth } from './lib/auth';
import { createClient } from '@clickhouse/client';
const clickhouseClient = createClient({
  host: "https://yzdf5janri.us-west-2.aws.clickhouse.cloud:8443",
  username: 'default',
  password: "1aJ1Yxy.VjVmw",
});

const config: StudioConfig = {
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
  // @ts-ignore
  events: {
    enabled: true,
    client: clickhouseClient,
    clientType: 'clickhouse',
    tableName: 'auth_events',
    batchSize: 10,
    flushInterval: 5000
  }
};

export default config;
