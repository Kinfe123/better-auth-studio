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

export interface WindowStudioConfig {
  basePath: string;
  metadata: Required<StudioMetadata>;
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

  return {
    basePath: config.basePath || '',
    metadata: mergedMetadata,
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
      modifiedHtml = modifiedHtml.replace(
        '</head>',
        `  ${faviconTag}\n</head>`
      );
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
