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

  const script = `
    <script>
      window.__STUDIO_CONFIG__ = ${safeJson};
      Object.freeze(window.__STUDIO_CONFIG__);
    </script>
  `;

  let modifiedHtml = html;

  if (config.basePath) {
    const basePath = config.basePath;
    modifiedHtml = modifiedHtml
      .replace(/href="\/assets\//g, `href="${basePath}/assets/`)
      .replace(/src="\/assets\//g, `src="${basePath}/assets/`)
      .replace(/href="\/vite\.svg"/g, `href="${basePath}/vite.svg"`);
  }

  // Inject the script before </head>
  return modifiedHtml.replace('</head>', `${script}</head>`);
}
