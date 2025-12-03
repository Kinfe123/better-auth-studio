import fs, { existsSync } from 'node:fs';
import path from 'node:path';
// @ts-expect-error
import babelPresetReact from '@babel/preset-react';
// @ts-expect-error
import babelPresetTypeScript from '@babel/preset-typescript';
import { BetterAuthError, logger } from 'better-auth';
import { loadConfig } from 'c12';
import { addSvelteKitEnvModules } from './add-svelte-kit-env-modules.js';
import { getTsconfigInfo } from './get-tsconfig-info.js';
let possiblePaths = ['auth.ts', 'auth.js', 'auth.server.js', 'auth.server.ts'];
possiblePaths = [
    ...possiblePaths,
    ...possiblePaths.map((it) => `lib/server/${it}`),
    ...possiblePaths.map((it) => `server/${it}`),
    ...possiblePaths.map((it) => `lib/${it}`),
    ...possiblePaths.map((it) => `utils/${it}`),
    ...possiblePaths.map((it) => `src/${it}`),
    ...possiblePaths.map((it) => `app/${it}`),
    ...possiblePaths.map((it) => `apps/${it}`),
];
function resolveReferencePath(configDir, refPath) {
    const resolvedPath = path.resolve(configDir, refPath);
    if (refPath.endsWith('.json')) {
        return resolvedPath;
    }
    if (fs.existsSync(resolvedPath)) {
        try {
            const stats = fs.statSync(resolvedPath);
            if (stats.isFile()) {
                return resolvedPath;
            }
        }
        catch { }
    }
    return path.resolve(configDir, refPath, 'tsconfig.json');
}
function getPathAliasesRecursive(tsconfigPath, visited = new Set()) {
    if (visited.has(tsconfigPath)) {
        return {};
    }
    visited.add(tsconfigPath);
    if (!fs.existsSync(tsconfigPath)) {
        logger.warn(`Referenced tsconfig not found: ${tsconfigPath}`);
        return {};
    }
    try {
        const tsConfig = getTsconfigInfo(undefined, tsconfigPath);
        const { paths = {}, baseUrl = '.' } = tsConfig.compilerOptions || {};
        const result = {};
        const configDir = path.dirname(tsconfigPath);
        const obj = Object.entries(paths);
        for (const [alias, aliasPaths] of obj) {
            for (const aliasedPath of aliasPaths) {
                const resolvedBaseUrl = path.resolve(configDir, baseUrl);
                const finalAlias = alias.slice(-1) === '*' ? alias.slice(0, -1) : alias;
                const finalAliasedPath = aliasedPath.slice(-1) === '*' ? aliasedPath.slice(0, -1) : aliasedPath;
                result[finalAlias || ''] = path.join(resolvedBaseUrl, finalAliasedPath);
            }
        }
        if (tsConfig.extends) {
            const extendsPath = Array.isArray(tsConfig.extends) ? tsConfig.extends[0] : tsConfig.extends;
            const extendedPath = path.isAbsolute(extendsPath)
                ? extendsPath
                : path.resolve(configDir, extendsPath);
            const extendedAliases = getPathAliasesRecursive(extendedPath, visited);
            for (const [alias, aliasPath] of Object.entries(extendedAliases)) {
                if (!(alias in result)) {
                    result[alias] = aliasPath;
                }
            }
        }
        if (tsConfig.references) {
            for (const ref of tsConfig.references) {
                const refPath = resolveReferencePath(configDir, ref.path);
                const refAliases = getPathAliasesRecursive(refPath, visited);
                for (const [alias, aliasPath] of Object.entries(refAliases)) {
                    if (!(alias in result)) {
                        result[alias] = aliasPath;
                    }
                }
            }
        }
        return result;
    }
    catch (error) {
        logger.warn(`Error parsing tsconfig at ${tsconfigPath}: ${error}`);
        return {};
    }
}
export function getPathAliases(cwd) {
    const tsConfigPath = path.join(cwd, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
        return null;
    }
    try {
        const result = getPathAliasesRecursive(tsConfigPath);
        addSvelteKitEnvModules(result);
        return result;
    }
    catch (_error) {
        throw new BetterAuthError('Error parsing tsconfig.json');
    }
}
/**
 * .tsx files are not supported by Jiti.
 */
const jitiOptions = (cwd) => {
    const alias = getPathAliases(cwd) || {};
    return {
        debug: false,
        transformOptions: {
            babel: {
                presets: [
                    [
                        babelPresetTypeScript,
                        {
                            isTSX: true,
                            allExtensions: true,
                        },
                    ],
                    [babelPresetReact, { runtime: 'automatic' }],
                ],
            },
        },
        extensions: ['.ts', '.js', '.jsx'],
        alias,
    };
};
const warnedMissingProviders = new Set();
const isDefaultExport = (object) => {
    return (typeof object === 'object' &&
        object !== null &&
        !Array.isArray(object) &&
        Object.keys(object).length > 0 &&
        'options' in object);
};
export async function getConfig({ cwd, configPath, shouldThrowOnError = false, }) {
    try {
        let configFile = null;
        if (configPath) {
            let resolvedPath = path.join(cwd, configPath);
            if (existsSync(configPath))
                resolvedPath = configPath;
            const { config } = await loadConfig({
                configFile: resolvedPath,
                dotenv: true,
                jitiOptions: jitiOptions(cwd),
            });
            if (!('auth' in config) && !isDefaultExport(config)) {
                if (shouldThrowOnError) {
                    throw new Error(`Couldn't read your auth config in ${resolvedPath}. Make sure to default export your auth instance or to export as a variable named auth.`);
                }
                logger.error(`Couldn't read your auth config in ${resolvedPath}. Make sure to default export your auth instance or to export as a variable named auth.`);
                process.exit(1);
            }
            configFile = 'auth' in config ? config.auth?.options : config.options;
        }
        if (!configFile) {
            for (const possiblePath of possiblePaths) {
                try {
                    const { config } = await loadConfig({
                        configFile: possiblePath,
                        jitiOptions: jitiOptions(cwd),
                    });
                    const hasConfig = Object.keys(config).length > 0;
                    if (hasConfig) {
                        configFile = config.auth?.options || config.default?.options || null;
                        if (!configFile) {
                            if (shouldThrowOnError) {
                                throw new Error("Couldn't read your auth config. Make sure to default export your auth instance or to export as a variable named auth.");
                            }
                            logger.error("Couldn't read your auth config.");
                            logger.info('Make sure to default export your auth instance or to export as a variable named auth.');
                            process.exit(1);
                        }
                        break;
                    }
                }
                catch (e) {
                    if (typeof e === 'object' &&
                        e &&
                        'message' in e &&
                        typeof e.message === 'string' &&
                        e.message.includes('This module cannot be imported from a Client Component module')) {
                        if (shouldThrowOnError) {
                            throw new Error(`Please remove import 'server-only' from your auth config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`);
                        }
                        logger.error(`Please remove import 'server-only' from your auth config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`);
                        process.exit(1);
                    }
                    if (shouldThrowOnError) {
                        throw e;
                    }
                    logger.error("Couldn't read your auth config.", e);
                    process.exit(1);
                }
            }
        }
        return configFile;
    }
    catch (e) {
        if (typeof e === 'object' &&
            e &&
            'message' in e &&
            typeof e.message === 'string' &&
            e.message.includes('This module cannot be imported from a Client Component module')) {
            if (shouldThrowOnError) {
                throw new Error(`Please remove import 'server-only' from your auth config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`);
            }
            logger.error(`Please remove import 'server-only' from your auth config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`);
            process.exit(1);
        }
        if (shouldThrowOnError) {
            throw e;
        }
        logger.error("Couldn't read your auth config.", e);
        process.exit(1);
    }
}
export { possiblePaths };
export async function findAuthConfig(configPath) {
    try {
        const betterAuthConfig = await getConfig({
            cwd: process.cwd(),
            configPath,
            shouldThrowOnError: false,
        });
        if (betterAuthConfig) {
            const authConfig = {
                database: {
                    type: betterAuthConfig.database ? 'drizzle' : 'unknown',
                    adapter: 'drizzle-adapter',
                    ...betterAuthConfig.database,
                },
                emailAndPassword: {
                    enabled: betterAuthConfig.emailAndPassword?.enabled || false,
                    ...betterAuthConfig.emailAndPassword,
                },
                socialProviders: betterAuthConfig.socialProviders
                    ? Object.keys(betterAuthConfig.socialProviders).map((provider) => {
                        const providerConfig = betterAuthConfig.socialProviders?.[provider];
                        const hasCredentials = Boolean(providerConfig?.clientId && providerConfig?.clientSecret);
                        return {
                            id: provider,
                            name: provider,
                            clientId: providerConfig?.clientId,
                            clientSecret: providerConfig?.clientSecret,
                            redirectURI: providerConfig?.redirectURI,
                            enabled: Boolean(hasCredentials && providerConfig?.redirectURI),
                        };
                    })
                    : [],
                trustedOrigins: Array.isArray(betterAuthConfig.trustedOrigins)
                    ? betterAuthConfig.trustedOrigins
                    : ['http://localhost:3000'],
                advanced: {
                    defaultCookieAttributes: betterAuthConfig.advanced?.defaultCookieAttributes || {
                        sameSite: 'none',
                        secure: true,
                        httpOnly: true,
                    },
                    ...betterAuthConfig.advanced,
                },
                plugins: betterAuthConfig?.options?.plugins || [],
            };
            return authConfig;
        }
        return null;
    }
    catch (_error) {
        return null;
    }
}
//# sourceMappingURL=config.js.map