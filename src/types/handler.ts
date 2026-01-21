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
export type TimeWindowPreset =
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d'
  | '2d'
  | '3d'
  | '7d'
  | '14d'
  | '30d';

// TimeWindowConfig is always an object with either 'since' OR 'custom' (mutually exclusive)
export type TimeWindowConfig =
  | {
      since: TimeWindowPreset; // Predefined time window (e.g., '1h', '30m', '1d')
      custom?: never; // Cannot use both 'since' and 'custom'
    }
  | {
      custom: number; // Custom duration in seconds (e.g., 2 * 60 * 60 for 2 hours)
      since?: never; // Cannot use both 'since' and 'custom'
    };

export type LiveMarqueeConfig = {
  enabled?: boolean;
  pollInterval?: number; // Polling interval in milliseconds (default: 2000)
  speed?: number; // Animation speed in pixels per frame (default: 0.5)
  pauseOnHover?: boolean; // Pause animation when hovered (default: true)
  limit?: number; // Maximum number of events to display in marquee (default: 50)
  sort?: 'asc' | 'desc'; // Sort order for events: 'desc' = newest first (default), 'asc' = oldest first
  colors?: EventColors;
  timeWindow?: TimeWindowConfig; // Time window for fetching events. Default: '1h'
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
    client?: any; // Client instance (Postgres pool, Prisma client, Drizzle instance, ClickHouse client, etc.)
    clientType?: 'postgres' | 'prisma' | 'drizzle' | 'clickhouse' | 'http' | 'custom' | 'sqlite';
    include?: AuthEventType[];
    exclude?: AuthEventType[];
    batchSize?: number;
    flushInterval?: number;
    retryOnError?: boolean;
    liveMarquee?: LiveMarqueeConfig;
  };
};

export type EventColors = {
  success?: string;
  info?: string;
  warning?: string;
  error?: string;
  failed?: string;
};

export type WindowStudioConfig = {
  basePath: string;
  metadata: Required<StudioMetadata>;
  liveMarquee?: LiveMarqueeConfig;
};

export function defineStudioConfig(config: StudioConfig): StudioConfig {
  return config;
}
