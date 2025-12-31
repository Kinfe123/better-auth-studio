import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function initCommand(options?: { apiDir?: string }) {
  console.log('🚀 Initializing Better Auth Studio...\n');

  const framework = detectFramework();
  console.log('🔍 Detected framework:', framework);

  const configPath = await createStudioConfig(framework);
  console.log('✅ Created config:', configPath);

  const basePath = '/api/studio';

  if (framework === 'nextjs') {
    await setupNextJS(basePath, options?.apiDir);
  } else if (framework === 'sveltekit') {
    await setupSvelteKit(basePath);
  } else {
    showManualInstructions(framework, basePath);
  }
}

async function createStudioConfig(framework: string): Promise<string> {
  const configPath = 'studio.config.ts';

  if (existsSync(configPath)) {
    console.log('⚠️  studio.config.ts already exists, skipping...');
    return configPath;
  }

  let authImportPath = './src/auth';
  if (framework === 'nextjs') {
    authImportPath = '@/lib/auth';
  } else if (framework === 'sveltekit') {
    authImportPath = '$lib/auth';
  }

  const configContent = `import type { StudioConfig } from 'better-auth-studio';
import { auth } from '${authImportPath}';

const config: StudioConfig = {
  auth,
  basePath: '/api/studio',
  metadata: {
    title: 'Admin Dashboard',
    theme: 'dark',
  },
};

export default config;
`;

  writeFileSync(configPath, configContent, 'utf-8');
  return configPath;
}

function detectNextJSAppDir(): string {
  if (existsSync(join(process.cwd(), 'src', 'app'))) {
    return 'src/app';
  }
  if (existsSync(join(process.cwd(), 'app'))) {
    return 'app';
  }
  return 'app';
}

async function setupNextJS(basePath: string, customApiDir?: string) {
  const segments = basePath.split('/').filter(Boolean);

  let appDir: string;
  if (customApiDir) {
    appDir = customApiDir;
    console.log(`📂 Using custom API directory: ${appDir}`);
  } else {
    appDir = detectNextJSAppDir();
    console.log(`📂 Auto-detected app directory: ${appDir}`);
  }

  const routeDir = join(process.cwd(), appDir, ...segments, '[[...path]]');
  const routeFile = join(routeDir, 'route.ts');

  if (existsSync(routeFile)) {
    console.log('⚠️  Route file already exists:', routeFile);
  } else {
    mkdirSync(routeDir, { recursive: true });
    const code = generateNextJSRoute();
    writeFileSync(routeFile, code, 'utf-8');
    console.log('✅ Generated route file:', routeFile);
  }

  const relativePath = `${appDir}${basePath}/[[...path]]/route.ts`;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    ✅ Next.js Setup Complete!                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📁 Files created:                                            ║
║     • studio.config.ts                                        ║
║     • ${relativePath}                                        ║
║                                                               ║
║  ⚠️  Important: Ensure better-auth-studio is in dependencies ║
║     (not devDependencies) for production deployments          ║
║                                                               ║
║  🚀 Start your app:                                           ║
║     pnpm dev                                                  ║
║                                                               ║
║  🌐 Dashboard will be at:                                     ║
║     http://localhost:3000${basePath}                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

function generateNextJSRoute(): string {
  return `import { createStudioHandler } from 'better-auth-studio/nextjs';
import studioConfig from '@/studio.config';

const handler = createStudioHandler(studioConfig);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
`;
}

async function setupSvelteKit(basePath: string) {
  const segments = basePath.split('/').filter(Boolean);
  const routeDir = join(process.cwd(), 'src', 'routes', ...segments, '[...path]');
  const routeFile = join(routeDir, '+server.ts');

  if (existsSync(routeFile)) {
    console.log('⚠️  Route file already exists:', routeFile);
  } else {
    mkdirSync(routeDir, { recursive: true });
    const code = generateSvelteKitRoute();
    writeFileSync(routeFile, code, 'utf-8');
    console.log('✅ Generated route file:', routeFile);
  }

  const relativePath = `src/routes${basePath}/[...path]/+server.ts`;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  ✅ SvelteKit Setup Complete!                ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📁 Files created:                                            ║
║     • studio.config.ts                                        ║
║     • ${relativePath}                                        ║
║                                                               ║
║  ⚠️  Important: Ensure better-auth-studio is in dependencies ║
║     (not devDependencies) for production deployments          ║
║                                                               ║
║  🚀 Start your app:                                           ║
║     pnpm dev                                                  ║
║                                                               ║
║  🌐 Dashboard will be at:                                     ║
║     http://localhost:5173${basePath}                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

function generateSvelteKitRoute(): string {
  return `import { betterAuthStudio } from 'better-auth-studio/svelte-kit';
import studioConfig from '../../../../../studio.config.js';

const handler = betterAuthStudio(studioConfig);

export async function GET(event) {
  return handler(event);
}

export async function POST(event) {
  return handler(event);
}

export async function PUT(event) {
  return handler(event);
}

export async function DELETE(event) {
  return handler(event);
}

export async function PATCH(event) {
  return handler(event);
}
`;
}

function showManualInstructions(framework: string, basePath: string) {
  const frameworkName = framework === 'express' ? 'Express' : 'your app';

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              📝 Manual Setup Required for ${frameworkName.padEnd(10)}       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📁 Created: studio.config.ts                                 ║
║                                                               ║
║  Add this to your server file:                                ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣

import { betterAuthStudio } from 'better-auth-studio/express';
import studioConfig from './studio.config';

app.use('${basePath}', betterAuthStudio(studioConfig));

╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🚀 Start your app and visit:                                 ║
║     http://localhost:3000${basePath}                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

function detectFramework(): string {
  // Check for SvelteKit
  if (
    existsSync('svelte.config.js') ||
    existsSync('svelte.config.ts') ||
    existsSync('src/routes') ||
    existsSync('src/hooks.server.ts')
  ) {
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.dependencies?.['@sveltejs/kit'] || pkg.devDependencies?.['@sveltejs/kit']) {
          return 'sveltekit';
        }
      }
    } catch {}
  }

  // Check for Next.js
  if (
    existsSync('next.config.js') ||
    existsSync('next.config.mjs') ||
    existsSync('next.config.ts')
  ) {
    return 'nextjs';
  }

  // Check for Express
  if (existsSync('src/index.ts') || existsSync('src/app.ts') || existsSync('src/server.ts')) {
    return 'express';
  }
  if (existsSync('app.js') || existsSync('server.js') || existsSync('index.js')) {
    return 'express';
  }

  // Check package.json for framework dependencies
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.dependencies?.['@sveltejs/kit'] || pkg.devDependencies?.['@sveltejs/kit']) {
        return 'sveltekit';
      }
      if (pkg.dependencies?.express || pkg.devDependencies?.express) {
        return 'express';
      }
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        return 'nextjs';
      }
    }
  } catch {}

  return 'unknown';
}
