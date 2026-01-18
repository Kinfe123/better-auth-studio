import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface StudioMetadata {
  title?: string;
  logo?: string;
  favicon?: string;
  company?: {
    name?: string;
    website?: string;
  };
  theme?: 'light' | 'dark';
  customStyles?: string;
}

export interface StudioAccessConfig {
  roles?: string[];
  allowEmails?: string[];
  sessionDuration?: number;
  secret?: string;
}

export interface StudioConfig {
  basePath?: string;
  metadata?: StudioMetadata;
  auth?: any;
  access?: StudioAccessConfig;
  [key: string]: any;
}

export interface EventColors {
  success?: string;
  info?: string;
  warning?: string;
  error?: string;
  failed?: string;
}

// LiveMarqueeConfig is defined in types/handler.ts
export interface LiveMarqueeConfig {
  enabled?: boolean;
  pollInterval?: number;
  speed?: number; // Animation speed in pixels per frame (default: 0.5)
  pauseOnHover?: boolean; // Pause animation when hovered (default: true)
  limit?: number; // Maximum number of events to display in marquee (default: 50)
  sort?: 'asc' | 'desc'; // Sort order for events: 'desc' = newest first (default), 'asc' = oldest first
  colors?: EventColors;
}

export interface WindowStudioConfig {
  basePath: string;
  metadata: Required<StudioMetadata>;
  liveMarquee?: LiveMarqueeConfig;
}

export function serveIndexHtml(publicDir: string, config: Partial<StudioConfig> = {}): string {
  const indexPath = join(publicDir, 'index.html');
  let html = readFileSync(indexPath, 'utf-8');

  const frontendConfig = prepareFrontendConfig(config);

  html = injectConfig(html, frontendConfig);

  return html;
}

function prepareFrontendConfig(config: Partial<StudioConfig>): WindowStudioConfig {
  const defaultMetadata: Required<StudioMetadata> = {
    title: 'Better Auth Studio',
    logo: '',
    favicon: '',
    company: {
      name: '',
      website: '',
    },
    theme: 'dark',
    customStyles: '',
  };

  const mergedMetadata: Required<StudioMetadata> = {
    ...defaultMetadata,
    ...(config.metadata || {}),
    company: {
      ...defaultMetadata.company,
      ...(config.metadata?.company || {}),
    },
  };

  const eventsConfig = (config as any).events;
  const liveMarqueeConfig = eventsConfig?.liveMarquee;

  const shouldIncludeLiveMarquee = !!liveMarqueeConfig || !!eventsConfig?.enabled;

  const liveMarquee: LiveMarqueeConfig | undefined = shouldIncludeLiveMarquee
    ? {
        enabled: liveMarqueeConfig?.enabled !== false, // Default to true if not explicitly false
        pollInterval: liveMarqueeConfig?.pollInterval || 2000, // Default: 2000ms
        speed: liveMarqueeConfig?.speed ?? 0.5, // Default: 0.5 pixels per frame
        pauseOnHover: liveMarqueeConfig?.pauseOnHover ?? true, // Default: true
        limit: liveMarqueeConfig?.limit ?? 50, // Default: 50 events in marquee
        sort: liveMarqueeConfig?.sort ?? 'desc', // Default: 'desc' (newest first)
        colors: liveMarqueeConfig?.colors || undefined,
      }
    : undefined;

  return {
    basePath: config.basePath || '',
    metadata: mergedMetadata,
    liveMarquee: liveMarquee,
  };
}

function injectConfig(html: string, config: WindowStudioConfig): string {
  // Safely serialize (prevent XSS)
  const safeJson = JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  // Escape title for HTML insertion
  const escapedTitle = config.metadata.title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const script = `
    <script>
      window.__STUDIO_CONFIG__ = ${safeJson};
      Object.freeze(window.__STUDIO_CONFIG__);
      // Update document title from config
      if (window.__STUDIO_CONFIG__?.metadata?.title) {
        document.title = window.__STUDIO_CONFIG__.metadata.title;
      }
    </script>
  `;

  let modifiedHtml = html;

  // Replace title tag
  modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`);

  // Replace favicon if provided
  if (config.metadata.favicon) {
    const escapedFavicon = config.metadata.favicon
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Determine MIME type from file extension
    const faviconLower = config.metadata.favicon.toLowerCase();
    let mimeType = 'image/png'; // default
    if (faviconLower.endsWith('.ico')) {
      mimeType = 'image/x-icon';
    } else if (faviconLower.endsWith('.svg')) {
      mimeType = 'image/svg+xml';
    } else if (faviconLower.endsWith('.jpg') || faviconLower.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (faviconLower.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    const faviconTag = `<link rel="icon" type="${mimeType}" href="${escapedFavicon}" />`;

    // Replace existing favicon/link rel="icon" tags
    modifiedHtml = modifiedHtml.replace(
      /<link[^>]*rel=["'](icon|shortcut icon)["'][^>]*>/gi,
      faviconTag
    );

    // If no existing favicon tag, add one before </head>
    if (!modifiedHtml.includes('rel="icon"') && !modifiedHtml.includes("rel='icon'")) {
      modifiedHtml = modifiedHtml.replace('</head>', `  ${faviconTag}\n</head>`);
    }
  }

  if (config.basePath) {
    const basePath = config.basePath;
    modifiedHtml = modifiedHtml
      .replace(/href="\/assets\//g, `href="${basePath}/assets/`)
      .replace(/src="\/assets\//g, `src="${basePath}/assets/`)
      .replace(/href="\/vite\.svg"/g, `href="${basePath}/vite.svg"`)
      .replace(/href="\/favicon\.svg"/g, `href="${basePath}/favicon.svg"`)
      .replace(/href="\/logo\.png"/g, `href="${basePath}/logo.png"`)
      .replace(/src="\/logo\.png"/g, `src="${basePath}/logo.png"`);
  }

  return modifiedHtml.replace('</head>', `${script}</head>`);
}
