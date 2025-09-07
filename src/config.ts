import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

export interface AuthProvider {
  type: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  [key: string]: any;
}

export interface AuthDatabase {
  url?: string;
  type?: string;
  dialect?: string;
  [key: string]: any;
}

export interface AuthConfig {
  database?: AuthDatabase;
  providers?: AuthProvider[];
  socialProviders?: Record<string, any>;
  emailAndPassword?: any;
  session?: any;
  secret?: string;
  rateLimit?: any;
  [key: string]: any;
}

export async function findAuthConfig(): Promise<AuthConfig | null> {
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
    'auth.config.json'
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
        } catch (error) {
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

async function loadConfig(configPath: string): Promise<AuthConfig | null> {
  const ext = configPath.split('.').pop();
  
  try {
    if (ext === 'json') {
      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } else if (ext === 'js' || ext === 'ts') {
      return await loadTypeScriptConfig(configPath);
    }
  } catch (error) {
    console.warn(`Error loading config from ${configPath}:`, error);
  }

  return null;
}

async function loadTypeScriptConfig(configPath: string): Promise<AuthConfig | null> {
  try {
    if (configPath.endsWith('.ts')) {
      try {
        const authModule = await import(configPath);
        
        if (authModule.auth) {
          console.log('Found auth export, extracting configuration...');
          const config = authModule.auth.options || authModule.auth;
          return extractBetterAuthFields(config);
        } else if (authModule.default) {
          console.log('Found default export, extracting configuration...');
          const config = authModule.default.options || authModule.default;
          return extractBetterAuthFields(config);
        }
      } catch (importError) {
        console.warn(`Failed to import auth config from ${configPath}:`, importError);
        console.log('Falling back to regex extraction...');
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
  } catch (error) {
    console.warn(`Error loading TypeScript config from ${configPath}:`, error);
    return null;
  }
}

function cleanConfigString(configStr: string): string {
  // First, let's handle the specific problematic patterns
  let cleaned = configStr;
  
  // Handle prismaAdapter calls specifically
  cleaned = cleaned.replace(/:\s*prismaAdapter\s*\(\s*\w+\s*,\s*\{[^}]*\}\s*\)/g, ':"prisma-adapter"');
  
  // Handle other function calls
  cleaned = cleaned.replace(/:\s*(\w+)\s*\(\s*[^)]*\)/g, ':"$1-function"');
  
  // Handle arrays
  cleaned = cleaned.replace(/:\s*\[[^\]]*\]/g, ':"array"');
  
  // Handle nested objects more carefully
  cleaned = cleaned.replace(/:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ':"object"');
  
  // Handle process.env variables
  cleaned = cleaned.replace(/:\s*process\.env\.(\w+)(\s*\|\|\s*"[^"]*")?/g, ':"$1"');
  
  // Handle template literals
  cleaned = cleaned.replace(/:\s*`([^`]*)`/g, ':"$1"');
  
  // Handle string literals - be more careful with quotes
  cleaned = cleaned.replace(/:\s*"([^"]*)"/g, ':"$1"');
  cleaned = cleaned.replace(/:\s*'([^']*)'/g, ':"$1"');
  
  // Handle unquoted strings (but be careful with numbers and booleans)
  cleaned = cleaned.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*[,}])/g, ':"$1"');
  
  // Quote property names
  cleaned = cleaned.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');
  
  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*}/g, '}');
  cleaned = cleaned.replace(/,\s*]/g, ']');
  
  // Remove comments
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Keep numbers, booleans, and null as-is
  cleaned = cleaned.replace(/:\s*(\d+\.?\d*)/g, ':$1');
  cleaned = cleaned.replace(/:\s*(true|false)/g, ':$1');
  cleaned = cleaned.replace(/:\s*null/g, ':null');
  
  return cleaned.trim();
}

export function extractBetterAuthConfig(content: string): AuthConfig | null {
  console.log('Extracting config from content:', content.substring(0, 500) + '...');
  
  // Try to extract plugins information directly from the content
  // First, look for plugins: runtime or plugins: [runtime]
  const pluginsMatch = content.match(/plugins\s*:\s*(?:\[)?(\w+)(?:\])?/);
  if (pluginsMatch) {
    const pluginsVar = pluginsMatch[1];
    console.log('Found plugins variable:', pluginsVar);
    
    // Look for the variable definition
    const varMatch = content.match(new RegExp(`const\\s+${pluginsVar}\\s*=\\s*[^\\[]*\\[([^\\]]*)\\]`));
    if (varMatch) {
      const pluginsContent = varMatch[1];
      const plugins = [];
      
      // Extract plugin names from the plugins array
      const pluginMatches = pluginsContent.match(/(\w+)\(\)/g);
      if (pluginMatches) {
        for (const pluginMatch of pluginMatches) {
          const pluginName = pluginMatch.replace(/\(\)/, '');
          plugins.push({
            id: pluginName,
            name: pluginName,
            version: 'unknown',
            description: `${pluginName} plugin for Better Auth`,
            enabled: true
          });
        }
      }
      
      if (plugins.length > 0) {
        console.log('Extracted plugins from content:', plugins);
        return {
          plugins: plugins,
          baseURL: 'http://localhost:3000', // Default fallback
          database: { type: 'unknown' }
        };
      }
    }
  }
  
  // Also try direct plugins array
  const directPluginsMatch = content.match(/plugins\s*:\s*\[([^\]]*)\]/);
  if (directPluginsMatch) {
    const pluginsContent = directPluginsMatch[1];
    const plugins = [];
    
    // Extract plugin names from the plugins array
    const pluginMatches = pluginsContent.match(/(\w+)\(\)/g);
    if (pluginMatches) {
      for (const pluginMatch of pluginMatches) {
        const pluginName = pluginMatch.replace(/\(\)/, '');
        plugins.push({
          id: pluginName,
          name: pluginName,
          version: 'unknown',
          description: `${pluginName} plugin for Better Auth`,
          enabled: true
        });
      }
    }
    
    if (plugins.length > 0) {
      console.log('Extracted plugins from content:', plugins);
      return {
        plugins: plugins,
        baseURL: 'http://localhost:3000', // Default fallback
        database: { type: 'unknown' }
      };
    }
  }
  
  // More precise patterns that handle real-world scenarios better
  const patterns = [
    // Pattern 1: export const auth = betterAuth({...})
    /export\s+const\s+\w+\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 2: export const auth = BetterAuth({...})
    /export\s+const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 3: const auth = betterAuth({...})
    /const\s+\w+\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 4: const auth = BetterAuth({...})
    /const\s+\w+\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 5: export default betterAuth({...})
    /export\s+default\s+betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 6: export default BetterAuth({...})
    /export\s+default\s+BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 7: module.exports = betterAuth({...})
    /module\.exports\s*=\s*betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 8: module.exports = BetterAuth({...})
    /module\.exports\s*=\s*BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 9: betterAuth({...}) - standalone
    /betterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 10: BetterAuth({...}) - standalone
    /BetterAuth\s*\(\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})\s*\)/,
    // Pattern 11: More flexible pattern for complex configs
    /betterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
    /BetterAuth\s*\(\s*({[\s\S]*?})\s*\)/,
    // Pattern 12: Handle the specific case with baseURL and database
    /betterAuth\s*\(\s*({[^{}]*baseURL[^{}]*database[^{}]*})\s*\)/,
    /BetterAuth\s*\(\s*({[^{}]*baseURL[^{}]*database[^{}]*})\s*\)/
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = content.match(pattern);
    if (match) {
      console.log(`Pattern ${i + 1} matched!`);
      console.log('Matched content:', match[1].substring(0, 200) + '...');
      try {
        let configStr = match[1];
        
        configStr = configStr
          .replace(/(\d+\s*\*\s*\d+\s*\*\s*\d+\s*\*\s*\d+)/g, (match) => {
            try {
              return eval(match).toString();
            } catch {
              return match;
            }
          })
          .replace(/(\d+\s*\*\s*\d+\s*\*\s*\d+)/g, (match) => {
            try {
              return eval(match).toString();
            } catch {
              return match;
            }
          })
          .replace(/(\d+\s*\*\s*\d+)/g, (match) => {
            try {
              return eval(match).toString();
            } catch {
              return match;
            }
          });
        
        configStr = cleanConfigString(configStr);
        
        console.log('Cleaned config string:', configStr.substring(0, 300) + '...');

        let config;
        try {
          config = JSON.parse(configStr);
        } catch (error) {
          console.warn(`Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.warn('Config string that failed:', configStr.substring(0, 200) + '...');
          return null;
        }
        
        return extractBetterAuthFields(config);
      } catch (error) {
        console.warn(`Failed to parse config pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
  }

  return null;
}

function extractBetterAuthFields(config: any): AuthConfig {
  console.log('Extracting fields from config:', JSON.stringify(config, null, 2));
  
  const authConfig: AuthConfig = {};

  if (config.database) {
    let dbType = 'postgresql'; // default
    let dbName = config.database.name;
    
    if (config.database.constructor && config.database.constructor.name === 'Database') {
      dbType = 'sqlite';
      dbName = config.database.name || './better-auth.db';
    } else if (config.database.name && config.database.name.endsWith('.db')) {
      dbType = 'sqlite';
    } else if (config.database.type) {
      dbType = config.database.type;
    } else if (config.database.dialect) {
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

  if (config.socialProviders) {
    if (typeof config.socialProviders === 'object' && !Array.isArray(config.socialProviders)) {
      authConfig.socialProviders = config.socialProviders;
      authConfig.providers = Object.entries(config.socialProviders).map(([provider, config]: [string, any]) => ({
        type: provider,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        ...config
      }));
    } else if (Array.isArray(config.socialProviders)) {
      authConfig.socialProviders = config.socialProviders;
      authConfig.providers = config.socialProviders;
    }
  }

  if (config.providers && Array.isArray(config.providers)) {
    authConfig.providers = config.providers.map((provider: any) => ({
      type: provider.type || provider.id,
      clientId: provider.clientId || provider.client_id,
      clientSecret: provider.clientSecret || provider.client_secret,
      ...provider
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
  if(config.plugins) {
    authConfig.plugins = config.plugins.map((plugin: any) => plugin.id);
  }
  console.log('Extracted auth config:', JSON.stringify(authConfig, null, 2));
  return authConfig;
}

async function evaluateJSConfig(configPath: string): Promise<AuthConfig | null> {
  try {
    const config = require(configPath);
    
    if (config.default) {
      return extractBetterAuthFields(config.default);
    } else if (typeof config === 'object') {
      return extractBetterAuthFields(config);
    }
    
    return null;
  } catch (error) {
    console.warn(`Error evaluating JS config from ${configPath}:`, error);
    return null;
  }
}
