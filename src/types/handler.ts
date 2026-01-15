export type UniversalRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
};

export type UniversalResponse = {
  status: number;
  headers: Record<string, string>;
  body: string | Buffer;
};

export type StudioMetadata = {
  title?: string;
  logo?: string;
  favicon?: string;
  company?: {
    name?: string;
    website?: string;
    supportEmail?: string;
  };
  theme?: 'dark' | 'light' | 'auto';
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  features?: {
    users?: boolean;
    sessions?: boolean;
    organizations?: boolean;
    analytics?: boolean;
    tools?: boolean;
    security?: boolean;
  };
  links?: Array<{ label: string; url: string }>;
  custom?: Record<string, any>;
};

export type StudioAccessConfig = {
  roles?: string[];
  allowEmails?: string[];
  sessionDuration?: number;
  secret?: string;
};

import type { AuthEventType, EventIngestionProvider } from './events.js';

export type StudioConfig = {
  auth: any;
  basePath?: string;
  access?: StudioAccessConfig;
  metadata?: StudioMetadata;
  events?: {
    enabled?: boolean;
    tableName?: string; // Auto-use Better Auth adapter if provided
    provider?: EventIngestionProvider; // Custom provider
    client?: any; // Client instance (Postgres pool, ClickHouse client, etc.)
    clientType?: 'postgres' | 'clickhouse' | 'http' | 'custom';
    include?: AuthEventType[];
    exclude?: AuthEventType[];
    batchSize?: number;
    flushInterval?: number;
    retryOnError?: boolean;
    liveMarquee?: {
      // default to true if not explicitly disabled
      enabled?: boolean;
      colors?: {
        success?: string;
        info?: string;
        warning?: string;
        error?: string;
        failed?: string;
      };
    };
  };
};

export type EventColors = {
  success?: string;
  info?: string;
  warning?: string;
  error?: string;
  failed?: string;
};

export type LiveMarqueeConfig = {
  enabled?: boolean;
  colors?: EventColors;
};

export type WindowStudioConfig = {
  basePath: string;
  metadata: Required<StudioMetadata>;
  liveMarquee?: LiveMarqueeConfig;
};

export function defineStudioConfig(config: StudioConfig): StudioConfig {
  return config;
}
