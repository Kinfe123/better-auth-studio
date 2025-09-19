import { existsSync, readFileSync } from 'fs';
import { createJiti } from 'jiti';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
function resolveModuleWithExtensions(id, parent) {
    if (!id.startsWith('./') && !id.startsWith('../')) {
        return id;
    }
    const parentDir = dirname(parent);
    const basePath = join(parentDir, id);
    const extensions = ['.ts', '.js', '.mjs', '.cjs'];
    for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (existsSync(fullPath)) {
            return pathToFileURL(fullPath).href;
        }
    }
    return id;
}
export async function findAuthConfig(configPath) {
    if (configPath) {
        // Handle both relative and absolute paths
        let resolvedPath;
        if (configPath.startsWith('/')) {
            // Absolute path
            resolvedPath = configPath;
        }
        else {
            // Relative path - try multiple resolution strategies
            const cwd = process.cwd();
            const possiblePaths = [
                join(cwd, configPath), // Direct relative to cwd
                join(cwd, '..', configPath), // One level up
                join(cwd, '../..', configPath), // Two levels up
                configPath, // Try as-is (in case it's already resolved)
            ];
            resolvedPath = possiblePaths.find((path) => existsSync(path)) || join(cwd, configPath);
        }
        if (existsSync(resolvedPath)) {
            try {
                const config = await loadConfig(resolvedPath);
                if (config) {
                    return config;
                }
            }
            catch (error) {
                console.warn(`Failed to load config from ${resolvedPath}:`, error);
            }
        }
        else {
            console.warn(`Config file not found: ${resolvedPath}`);
            // Try to find the file in common monorepo locations
            const cwd = process.cwd();
            const commonPaths = [
                join(cwd, 'apps', 'backend', 'src', 'auth.ts'),
                join(cwd, 'apps', 'backend', 'auth.ts'),
                join(cwd, 'packages', 'backend', 'src', 'auth.ts'),
                join(cwd, 'packages', 'backend', 'auth.ts'),
                join(cwd, 'src', 'auth.ts'),
                join(cwd, 'auth.ts'),
            ];
            for (const path of commonPaths) {
                if (existsSync(path)) {
                    console.log(`Found config file at: ${path}`);
                    try {
                        const config = await loadConfig(path);
                        if (config) {
                            return config;
                        }
                    }
                    catch (error) {
                        console.warn(`Failed to load config from ${path}:`, error);
                    }
                }
            }
        }
        return null;
    }
    const possibleConfigFiles = [
        'studio-config.json',
        'auth.ts',
        'auth.js',
        'src/auth.ts',
        'src/auth.js',
        'lib/auth.ts',
        'lib/auth.js',
        'better-auth.config.ts',
        'better-auth.config.js',
        'better-auth.config.json',
        'auth.config.ts',
        'auth.config.js',
        'auth.config.json',
    ];
    let currentDir = process.cwd();
    const maxDepth = 10;
    let depth = 0;
    while (currentDir && depth < maxDepth) {
        for (const configFile of possibleConfigFiles) {
            const configPath = join(currentDir, configFile);
            if (existsSync(configPath)) {
                try {
                    const config = await loadConfig(configPath);
                    if (config) {
                        return config;
                    }
                }
                catch (error) {
                    console.warn(`Failed to load config from ${configPath}:`, error);
                }
            }
        }
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
        depth++;
    }
    return null;
}
async function loadConfig(configPath) {
    const ext = configPath.split('.').pop();
    try {
        if (ext === 'json') {
            const content = readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        }
        else if (ext === 'js' || ext === 'ts') {
            return await loadTypeScriptConfig(configPath);
        }
    }
    catch (error) {
        console.warn(`Error loading config from ${configPath}:`, error);
    }
    return null;
}
async function loadTypeScriptConfig(configPath) {
    try {
        if (configPath.endsWith('.ts')) {
            try {
                const aliases = {};
                const configDir = dirname(configPath);
                const content = readFileSync(configPath, 'utf-8');
                const relativeImportRegex = /import\s+.*?\s+from\s+['"](\.\/[^'"]+)['"]/g;
                const dynamicImportRegex = /import\s*\(\s*['"](\.\/[^'"]+)['"]\s*\)/g;
                const foundImports = new Set();
                let match;
                while ((match = relativeImportRegex.exec(content)) !== null) {
                    foundImports.add(match[1]);
                }
                while ((match = dynamicImportRegex.exec(content)) !== null) {
                    foundImports.add(match[1]);
                }
                for (const importPath of foundImports) {
                    const importName = importPath.replace('./', '');
                    const possiblePaths = [
                        join(configDir, importName + '.ts'),
                        join(configDir, importName + '.js'),
                        join(configDir, importName + '.mjs'),
                        join(configDir, importName + '.cjs'),
                        join(configDir, importName, 'index.ts'),
                        join(configDir, importName, 'index.js'),
                        join(configDir, importName, 'index.mjs'),
                        join(configDir, importName, 'index.cjs'),
                    ];
                    for (const path of possiblePaths) {
                        if (existsSync(path)) {
                            aliases[importPath] = pathToFileURL(path).href;
                            break;
                        }
                    }
                }
                try {
                    let importPath = configPath;
                    if (!configPath.startsWith('/')) {
                        importPath = join(process.cwd(), configPath);
                    }
                    console.log({ importPath });
                    const jitiInstance = createJiti(importPath, {
                        debug: true,
                        fsCache: true,
                        moduleCache: true,
                        interopDefault: true,
                    });
                    console.log({ jitiInstance });
                    const authModule = await jitiInstance.import(importPath);
                    console.log({ authModule });
                    const auth = authModule.auth || authModule.default || authModule;
                    if (auth && typeof auth === 'object') {
                        try {
                            if (auth.$context) {
                                const context = await auth.$context;
                                const adapter = context.adapter;
                                const config = {
                                    database: {
                                        type: 'drizzle',
                                        adapter: 'drizzle-adapter',
                                    },
                                    emailAndPassword: {
                                        enabled: true,
                                    },
                                    trustedOrigins: ['http://localhost:3000'],
                                    advanced: {
                                        defaultCookieAttributes: {
                                            sameSite: 'none',
                                            secure: true,
                                            httpOnly: true,
                                        },
                                    },
                                };
                                return config;
                            }
                        }
                        catch (contextError) { }
                    }
                }
                catch (importError) {
                    console.warn(`Failed to import auth config from ${configPath}:`, importError.message);
                }
                const config = {
                    database: {
                        type: 'drizzle',
                        adapter: 'drizzle-adapter',
                    },
                    emailAndPassword: {
                        enabled: true,
                    },
                    trustedOrigins: ['http://localhost:3000'],
                    advanced: {
                        defaultCookieAttributes: {
                            sameSite: 'none',
                            secure: true,
                            httpOnly: true,
                        },
                    },
                };
                return config;
            }
            catch (importError) {
                console.warn(`Failed to import auth config from ${configPath}:`, importError.message);
            }
        }
        const content = readFileSync(configPath, 'utf-8');
        const authConfig = extractBetterAuthConfig(content);
        if (authConfig) {
            return authConfig;
        }
        if (configPath.endsWith('.js')) {
            return await evaluateJSConfig(configPath);
        }
        return null;
    }
    catch (error) {
        console.warn(`Error loading TypeScript config from ${configPath}:`, error);
        return null;
    }
}
function detectDatabaseAdapter(content) {
    const database = {};
    if (content.includes('drizzleAdapter')) {
        database.adapter = 'drizzle';
        const providerMatch = content.match(/drizzleAdapter\s*\(\s*\w+\s*,\s*\{[^}]*provider\s*:\s*["']([^"']+)["'][^}]*\}/);
        if (providerMatch) {
            const provider = providerMatch[1];
            database.provider = provider;
            database.type = provider === 'pg' ? 'postgresql' : provider;
        }
        else {
            database.provider = 'postgresql';
            database.type = 'postgresql';
        }
    }
    else if (content.includes('prismaAdapter')) {
        database.adapter = 'prisma';
        const providerMatch = content.match(/prismaAdapter\s*\(\s*\w+\s*,\s*\{[^}]*provider\s*:\s*["']([^"']+)["'][^}]*\}/);
        if (providerMatch) {
            database.provider = providerMatch[1];
            database.type = providerMatch[1];
        }
        else {
            database.provider = 'postgresql';
            database.type = 'postgresql';
        }
    }
    else if (content.includes('better-sqlite3') || content.includes('new Database(')) {
        database.adapter = 'sqlite';
        database.type = 'sqlite';
        database.provider = 'sqlite';
        const dbPathMatch = content.match(/new\s+Database\s*\(\s*["']([^"']+)["']\s*\)/);
        if (dbPathMatch) {
            database.name = dbPathMatch[1];
        }
    }
    const urlMatch = content.match(/DATABASE_URL|DB_URL|DB_CONNECTION_STRING/);
    if (urlMatch) {
        database.url = `process.env.${urlMatch[0]}`;
    }
    return database;
}
function cleanConfigString(configStr) {
    let cleaned = configStr;
    cleaned = cleaned.replace(/:\s*prismaAdapter\s*\(\s*\w+\s*,\s*\{[^}]*\}\s*\)/g, ':"prisma-adapter"');
    cleaned = cleaned.replace(/:\s*prismaAdapter\s*\(\s*\w+\s*\)/g, ':"prisma-adapter"');
    cleaned = cleaned.replace(/:\s*drizzleAdapter\s*\(\s*\w+\s*,\s*\{[^}]*\}\s*\)/g, ':"drizzle-adapter"');
    cleaned = cleaned.replace(/:\s*drizzleAdapter\s*\(\s*\w+\s*\)/g, ':"drizzle-adapter"');
    cleaned = cleaned.replace(/:\s*betterSqlite3\s*\(\s*[^)]*\)/g, ':"better-sqlite3"');
    cleaned = cleaned.replace(/:\s*postgres\s*\(\s*[^)]*\)/g, ':"postgres"');
    cleaned = cleaned.replace(/:\s*mysql2\s*\(\s*[^)]*\)/g, ':"mysql2"');
    cleaned = cleaned.replace(/:\s*bun:sqlite\s*\(\s*[^)]*\)/g, ':"bun-sqlite"');
    cleaned = cleaned.replace(/:\s*new\s+Database\s*\(\s*[^)]*\)/g, ':"sqlite-database"');
    cleaned = cleaned.replace(/new\s+Database\s*\(\s*[^)]*\)/g, '"sqlite-database"');
    cleaned = cleaned.replace(/:\s*(\w+)\s*\(\s*[^)]*\)/g, ':"$1-function"');
    cleaned = cleaned.replace(/:\s*\[[^\]]*\]/g, ':"array"');
    cleaned = cleaned.replace(/:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ':"object"');
    cleaned = cleaned.replace(/:\s*process\.env\.(\w+)(\s*\|\|\s*"[^"]*")?/g, ':"$1"');
    cleaned = cleaned.replace(/:\s*`([^`]*)`/g, ':"$1"');
    cleaned = cleaned.replace(/:\s*"([^"]*)"/g, ':"$1"');
    cleaned = cleaned.replace(/:\s*'([^']*)'/g, ':"$1"');
    cleaned = cleaned.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*[,}])/g, ':"$1"');
    cleaned = cleaned.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');
    cleaned = cleaned.replace(/,\s*}/g, '}');
    cleaned = cleaned.replace(/,\s*]/g, ']');
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/:\s*(\d+\.?\d*)/g, ':$1');
    cleaned = cleaned.replace(/:\s*(true|false)/g, ':$1');
    cleaned = cleaned.replace(/:\s*null/g, ':null');
    return cleaned.trim();
}
export function extractBetterAuthConfig(content) {
    const pluginsMatch = content.match(/plugins\s*:\s*(?:\[)?(\w+)(?:\])?/);
    if (pluginsMatch) {
        const pluginsVar = pluginsMatch[1];
        const varMatch = content.match(new RegExp(`const\\s+${pluginsVar}\\s*=\\s*[^\\[]*\\[([^\\]]*)\\]`));
        if (varMatch) {
            const pluginsContent = varMatch[1];
            const plugins = [];
            const pluginMatches = pluginsContent.match(/(\w+)\(\)/g);
            if (pluginMatches) {
                for (const pluginMatch of pluginMatches) {
                    const pluginName = pluginMatch.replace(/\(\)/, '');
                    const plugin = {
                        id: pluginName,
                        name: pluginName,
                        version: 'unknown',
                        description: `${pluginName} plugin for Better Auth`,
                        enabled: true,
                    };
                    if (pluginName === 'organization') {
                        const orgConfigMatch = content.match(/organization\s*\(\s*\{[^}]*teams[^}]*enabled[^}]*\}/);
                        if (orgConfigMatch) {
                            plugin.teams = { enabled: true };
                        }
                    }
                    plugins.push(plugin);
                }
            }
            if (plugins.length > 0) {
                const database = detectDatabaseAdapter(content);
                return {
                    plugins: plugins,
                    baseURL: 'http://localhost:3000',
                    database: database,
                };
            }
        }
    }
    const directPluginsMatch = content.match(/plugins\s*:\s*\[([^\]]*)\]/);
    if (directPluginsMatch) {
        const pluginsContent = directPluginsMatch[1];
        const plugins = [];
        const pluginMatches = pluginsContent.match(/(\w+)\(\)/g);
        if (pluginMatches) {
            for (const pluginMatch of pluginMatches) {
                const pluginName = pluginMatch.replace(/\(\)/, '');
                const plugin = {
                    id: pluginName,
                    name: pluginName,
                    version: 'unknown',
                    description: `${pluginName} plugin for Better Auth`,
                    enabled: true,
                };
                if (pluginName === 'organization') {
                    const orgConfigMatch = content.match(/organization\s*\(\s*\{[^}]*teams[^}]*enabled[^}]*\}/);
                    if (orgConfigMatch) {
                        plugin.teams = { enabled: true };
                    }
                }
                plugins.push(plugin);
            }
        }
        if (plugins.length > 0) {
            const database = detectDatabaseAdapter(content);
            return {
                plugins: plugins,
                baseURL: 'http://localhost:3000',
                database: database,
            };
        }
    }
    const patterns = [
        /export\s+const\s+\w+\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /export\s+const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /const\s+\w+\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /export\s+default\s+betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /export\s+default\s+BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /module\.exports\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /module\.exports\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
        /betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        /BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        /betterAuth\s*\(\s*({[^{}]*baseURL[^{}]*database[^{}]*})\s*\)/,
        /BetterAuth\s*\(\s*({[^{}]*baseURL[^{}]*database[^{}]*})\s*\)/,
    ];
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = content.match(pattern);
        if (match) {
            try {
                let configStr = match[1];
                configStr = configStr
                    .replace(/(\d+\s*\*\s*\d+\s*\*\s*\d+\s*\*\s*\d+)/g, (match) => {
                    try {
                        return eval(match).toString();
                    }
                    catch {
                        return match;
                    }
                })
                    .replace(/(\d+\s*\*\s*\d+\s*\*\s*\d+)/g, (match) => {
                    try {
                        return eval(match).toString();
                    }
                    catch {
                        return match;
                    }
                })
                    .replace(/(\d+\s*\*\s*\d+)/g, (match) => {
                    try {
                        return eval(match).toString();
                    }
                    catch {
                        return match;
                    }
                });
                configStr = cleanConfigString(configStr);
                let config;
                try {
                    config = JSON.parse(configStr);
                }
                catch (error) {
                    console.warn(`Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    console.warn('Config string that failed:', configStr.substring(0, 200) + '...');
                    return null;
                }
                const authConfig = extractBetterAuthFields(config);
                if (authConfig) {
                    const detectedDatabase = detectDatabaseAdapter(content);
                    if (detectedDatabase.adapter) {
                        authConfig.database = { ...authConfig.database, ...detectedDatabase };
                    }
                }
                return authConfig;
            }
            catch (error) {
                console.warn(`Failed to parse config pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    return null;
}
function extractBetterAuthFields(config) {
    const authConfig = {};
    if (config.database) {
        let dbType = 'postgresql';
        let dbName = config.database.name;
        let adapter = 'unknown';
        if (typeof config.database === 'function') {
            if (config.database.options?.adapterId) {
                adapter = config.database.options.adapterId;
                if (config.database.options.provider) {
                    const provider = config.database.options.provider;
                    dbType = provider === 'pg' ? 'postgresql' : provider;
                }
            }
            else if (config.database.options?.provider) {
                const provider = config.database.options.provider;
                if (provider === 'pg' || provider === 'mysql' || provider === 'sqlite') {
                    adapter = 'drizzle';
                    dbType = provider === 'pg' ? 'postgresql' : provider;
                }
                else {
                    adapter = 'prisma';
                    dbType = 'postgresql';
                }
            }
            else if (config.database.provider) {
                const provider = config.database.provider;
                if (provider === 'pg' || provider === 'mysql' || provider === 'sqlite') {
                    adapter = 'drizzle';
                    dbType = provider === 'pg' ? 'postgresql' : provider;
                }
                else {
                    adapter = 'prisma';
                    dbType = 'postgresql';
                }
            }
            else {
                adapter = 'prisma';
                dbType = 'postgresql';
            }
        }
        else if (config.database.constructor?.name === 'Database' ||
            (typeof config.database === 'object' &&
                config.database.constructor &&
                config.database.constructor.name === 'Database')) {
            dbType = 'sqlite';
            dbName = config.database.name || './better-auth.db';
            adapter = 'sqlite';
        }
        else if (config.database.name?.endsWith('.db') ||
            (typeof config.database === 'string' && config.database.endsWith('.db'))) {
            dbType = 'sqlite';
            adapter = 'sqlite';
        }
        else if (config.database.provider) {
            const provider = config.database.provider;
            if (provider === 'pg' ||
                provider === 'postgresql' ||
                provider === 'mysql' ||
                provider === 'sqlite') {
                adapter = 'drizzle';
                dbType = provider === 'pg' ? 'postgresql' : provider;
            }
            else {
                adapter = 'prisma';
                dbType = provider;
            }
        }
        else if (config.database.adapter) {
            adapter = config.database.adapter;
            if (config.database.provider) {
                const provider = config.database.provider;
                if (provider === 'pg' ||
                    provider === 'postgresql' ||
                    provider === 'mysql' ||
                    provider === 'sqlite') {
                    adapter = 'drizzle';
                    dbType = provider === 'pg' ? 'postgresql' : provider;
                }
                else {
                    dbType = provider;
                }
            }
            else {
                dbType = adapter;
            }
        }
        else if (config.database.type) {
            dbType = config.database.type;
            adapter = config.database.type;
        }
        if (config.database.provider &&
            (config.database.provider === 'postgresql' ||
                config.database.provider === 'pg' ||
                config.database.provider === 'mysql' ||
                config.database.provider === 'sqlite')) {
            adapter = 'drizzle';
            dbType = config.database.provider === 'pg' ? 'postgresql' : config.database.provider;
        }
        authConfig.database = {
            url: config.database.url || config.database.connectionString,
            name: dbName,
            type: adapter === 'drizzle' ? `${dbType} (${adapter})` : dbType,
            adapter: adapter,
            dialect: config.database.dialect,
            provider: config.database.provider,
            casing: config.database.casing,
        };
    }
    if (config.socialProviders) {
        if (typeof config.socialProviders === 'object' && !Array.isArray(config.socialProviders)) {
            authConfig.socialProviders = config.socialProviders;
            authConfig.providers = Object.entries(config.socialProviders).map(([provider, config]) => ({
                type: provider,
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: config.redirectUri,
                ...config,
            }));
        }
        else if (Array.isArray(config.socialProviders)) {
            authConfig.socialProviders = config.socialProviders;
            authConfig.providers = config.socialProviders;
        }
    }
    if (config.providers && Array.isArray(config.providers)) {
        authConfig.providers = config.providers.map((provider) => ({
            type: provider.type || provider.id,
            clientId: provider.clientId || provider.client_id,
            clientSecret: provider.clientSecret || provider.client_secret,
            ...provider,
        }));
    }
    if (config.emailAndPassword) {
        authConfig.emailAndPassword = config.emailAndPassword;
    }
    if (config.session) {
        authConfig.session = config.session;
    }
    if (config.secret) {
        authConfig.secret = config.secret;
    }
    if (config.rateLimit) {
        authConfig.rateLimit = config.rateLimit;
    }
    if (config.telemetry) {
        authConfig.telemetry = config.telemetry;
    }
    if (config.plugins) {
        authConfig.plugins = config.plugins.map((plugin) => plugin.id);
    }
    return authConfig;
}
async function evaluateJSConfig(configPath) {
    try {
        const config = require(configPath);
        if (config.auth) {
            const authConfig = config.auth.options || config.auth;
            return extractBetterAuthFields(authConfig);
        }
        if (config.default) {
            return extractBetterAuthFields(config.default);
        }
        else if (typeof config === 'object') {
            return extractBetterAuthFields(config);
        }
        return null;
    }
    catch (error) {
        console.warn(`Error evaluating JS config from ${configPath}:`, error);
        return null;
    }
}
//# sourceMappingURL=config.js.map