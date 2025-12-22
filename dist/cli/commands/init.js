import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
export async function initCommand() {
    console.log('🚀 Initializing Better Auth Studio...\n');
    const framework = detectFramework();
    console.log('🔍 Detected framework:', framework);
    const configPath = await createStudioConfig(framework);
    console.log('✅ Created config:', configPath);
    const basePath = '/api/studio';
    if (framework === 'nextjs') {
        await setupNextJS(basePath);
    }
    else {
        showManualInstructions(framework, basePath);
    }
}
async function createStudioConfig(framework) {
    const configPath = 'studio.config.ts';
    if (existsSync(configPath)) {
        console.log('⚠️  studio.config.ts already exists, skipping...');
        return configPath;
    }
    const authImportPath = framework === 'nextjs'
        ? '@/lib/auth'
        : './src/auth';
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
async function setupNextJS(basePath) {
    const segments = basePath.split('/').filter(Boolean);
    const routeDir = join(process.cwd(), 'app', ...segments, '[[...path]]');
    const routeFile = join(routeDir, 'route.ts');
    if (existsSync(routeFile)) {
        console.log('⚠️  Route file already exists:', routeFile);
    }
    else {
        mkdirSync(routeDir, { recursive: true });
        const code = generateNextJSRoute();
        writeFileSync(routeFile, code, 'utf-8');
        console.log('✅ Generated route file:', routeFile);
    }
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    ✅ Next.js Setup Complete!                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📁 Files created:                                            ║
║     • studio.config.ts                                        ║
║     • app${basePath}/[[...path]]/route.ts                     ║
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
function generateNextJSRoute() {
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
function showManualInstructions(framework, basePath) {
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
function detectFramework() {
    if (existsSync('next.config.js') || existsSync('next.config.mjs') || existsSync('next.config.ts')) {
        return 'nextjs';
    }
    if (existsSync('src/index.ts') || existsSync('src/app.ts') || existsSync('src/server.ts')) {
        return 'express';
    }
    if (existsSync('app.js') || existsSync('server.js') || existsSync('index.js')) {
        return 'express';
    }
    try {
        const pkgPath = join(process.cwd(), 'package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            if (pkg.dependencies?.express || pkg.devDependencies?.express) {
                return 'express';
            }
            if (pkg.dependencies?.next || pkg.devDependencies?.next) {
                return 'nextjs';
            }
        }
    }
    catch { }
    return 'unknown';
}
//# sourceMappingURL=init.js.map