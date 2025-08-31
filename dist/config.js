"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAuthConfig = findAuthConfig;
const fs_1 = require("fs");
const path_1 = require("path");
async function findAuthConfig() {
    const possibleConfigFiles = [
        'studio-config.json',
        'auth.ts',
        'auth.js',
        'src/auth.ts',
        'src/auth.js',
        'better-auth.config.ts',
        'better-auth.config.js',
        'better-auth.config.json',
        'auth.config.ts',
        'auth.config.js',
        'auth.config.json'
    ];
    // Start from current directory and walk up
    let currentDir = process.cwd();
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    while (currentDir && depth < maxDepth) {
        for (const configFile of possibleConfigFiles) {
            const configPath = (0, path_1.join)(currentDir, configFile);
            if ((0, fs_1.existsSync)(configPath)) {
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
        const parentDir = (0, path_1.dirname)(currentDir);
        if (parentDir === currentDir) {
            break; // Reached root
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
            const content = (0, fs_1.readFileSync)(configPath, 'utf-8');
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
        // For TypeScript files, try to directly import the auth export
        if (configPath.endsWith('.ts')) {
            try {
                // Try to import the auth configuration directly
                const authModule = await Promise.resolve(`${configPath}`).then(s => __importStar(require(s)));
                // Look for the auth export
                if (authModule.auth) {
                    console.log('Found auth export, extracting configuration...');
                    // Better Auth exports have the config under options
                    const config = authModule.auth.options || authModule.auth;
                    return extractBetterAuthFields(config);
                }
                else if (authModule.default) {
                    console.log('Found default export, extracting configuration...');
                    // Better Auth exports have the config under options
                    const config = authModule.default.options || authModule.default;
                    return extractBetterAuthFields(config);
                }
            }
            catch (importError) {
                console.warn(`Failed to import auth config from ${configPath}:`, importError);
                console.log('Falling back to regex extraction...');
            }
        }
        // Fallback: try regex extraction
        const content = (0, fs_1.readFileSync)(configPath, 'utf-8');
        const authConfig = extractBetterAuthConfig(content);
        if (authConfig) {
            return authConfig;
        }
        // Fallback: try to evaluate the file (for JS files)
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
function extractBetterAuthConfig(content) {
    console.log('Extracting config from content:', content.substring(0, 500) + '...');
    // Look for Better Auth configuration patterns
    const patterns = [
        // Pattern 1: export const auth = betterAuth({...})
        /export\s+const\s+\w+\s*=\s*betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 2: export const auth = BetterAuth({...})
        /export\s+const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 3: const auth = betterAuth({...})
        /const\s+\w+\s*=\s*betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 4: const auth = BetterAuth({...})
        /const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 5: export default betterAuth({...})
        /export\s+default\s+betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 6: export default BetterAuth({...})
        /export\s+default\s+BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 7: module.exports = betterAuth({...})
        /module\.exports\s*=\s*betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 8: module.exports = BetterAuth({...})
        /module\.exports\s*=\s*BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 9: export default {...}
        /export\s+default\s*({[\s\S]*?});?$/m,
        // Pattern 10: module.exports = {...}
        /module\.exports\s*=\s*({[\s\S]*?});?$/m,
        // Pattern 11: betterAuth({...}) - more flexible
        /betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 12: BetterAuth({...}) - more flexible
        /BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
        // Pattern 13: Any object with socialProviders
        /({[\s\S]*?"socialProviders"[\s\S]*?})/,
        // Pattern 14: Any object with emailAndPassword
        /({[\s\S]*?"emailAndPassword"[\s\S]*?})/,
        // Pattern 15: Any object with database
        /({[\s\S]*?"database"[\s\S]*?})/
    ];
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = content.match(pattern);
        if (match) {
            console.log(`Pattern ${i + 1} matched!`);
            console.log('Matched content:', match[1].substring(0, 200) + '...');
            try {
                // Clean up the matched content to make it valid JSON
                let configStr = match[1];
                // First, handle arithmetic expressions
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
                // Replace TypeScript-specific syntax
                configStr = configStr
                    .replace(/:\s*process\.env\.(\w+)(\s*\|\|\s*"[^"]*")?/g, ':"$1"') // Replace process.env.VAR || "default" with "VAR"
                    .replace(/:\s*`([^`]*)`/g, ':"$1"') // Replace template literals
                    .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes
                    .replace(/:\s*"([^"]*)"/g, ':"$1"') // Keep double quotes
                    .replace(/:\s*(\w+)/g, ':"$1"') // Replace unquoted keys
                    .replace(/(\w+):/g, '"$1":') // Quote property names
                    .replace(/,\s*}/g, '}') // Remove trailing commas
                    .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
                    .replace(/\/\/.*$/gm, '') // Remove single-line comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .replace(/:\s*(\d+)/g, ':$1') // Keep numbers
                    .replace(/:\s*(true|false)/g, ':$1') // Keep booleans
                    .replace(/:\s*null/g, ':null') // Keep null
                    .trim();
                console.log('Cleaned config string:', configStr.substring(0, 300) + '...');
                // Try to parse as JSON
                let config;
                try {
                    config = JSON.parse(configStr);
                }
                catch (error) {
                    console.warn(`Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    console.warn('Config string that failed:', configStr.substring(0, 200) + '...');
                    return null;
                }
                // Extract Better Auth specific configuration
                return extractBetterAuthFields(config);
            }
            catch (error) {
                console.warn(`Failed to parse config pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
                continue;
            }
        }
    }
    return null;
}
function extractBetterAuthFields(config) {
    console.log('Extracting fields from config:', JSON.stringify(config, null, 2));
    const authConfig = {};
    // Extract database configuration
    if (config.database) {
        // Detect SQLite database
        let dbType = 'postgresql'; // default
        let dbName = config.database.name;
        // Check if it's a SQLite database instance
        if (config.database.constructor && config.database.constructor.name === 'Database') {
            dbType = 'sqlite';
            dbName = config.database.name || './better-auth.db';
        }
        else if (config.database.name && config.database.name.endsWith('.db')) {
            dbType = 'sqlite';
        }
        else if (config.database.type) {
            dbType = config.database.type;
        }
        else if (config.database.dialect) {
            dbType = config.database.dialect;
        }
        authConfig.database = {
            url: config.database.url || config.database.connectionString,
            name: dbName,
            type: dbType,
            dialect: config.database.dialect,
            casing: config.database.casing
        };
    }
    // Extract social providers - handle both object and array formats
    if (config.socialProviders) {
        if (typeof config.socialProviders === 'object' && !Array.isArray(config.socialProviders)) {
            // Object format: { github: { clientId, clientSecret, ... } }
            authConfig.socialProviders = config.socialProviders;
            authConfig.providers = Object.entries(config.socialProviders).map(([provider, config]) => ({
                type: provider,
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: config.redirectUri,
                ...config
            }));
        }
        else if (Array.isArray(config.socialProviders)) {
            // Array format: [{ type: 'github', clientId, clientSecret, ... }]
            authConfig.socialProviders = config.socialProviders;
            authConfig.providers = config.socialProviders;
        }
    }
    // Extract legacy providers format
    if (config.providers && Array.isArray(config.providers)) {
        authConfig.providers = config.providers.map((provider) => ({
            type: provider.type || provider.id,
            clientId: provider.clientId || provider.client_id,
            clientSecret: provider.clientSecret || provider.client_secret,
            ...provider
        }));
    }
    // Extract email and password configuration
    if (config.emailAndPassword) {
        authConfig.emailAndPassword = config.emailAndPassword;
    }
    // Extract other Better Auth specific fields
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
    console.log('Extracted auth config:', JSON.stringify(authConfig, null, 2));
    return authConfig;
}
async function evaluateJSConfig(configPath) {
    try {
        // For JS files, we can try to require them
        const config = require(configPath);
        // Handle different export patterns
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