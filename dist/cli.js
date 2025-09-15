#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { startStudio } from './studio.js';
import { findAuthConfig } from './config.js';
async function findAuthConfigPath() {
    const possibleConfigFiles = [
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
        'studio-config.json'
    ];
    let currentDir = process.cwd();
    const maxDepth = 10;
    let depth = 0;
    while (currentDir && depth < maxDepth) {
        for (const configFile of possibleConfigFiles) {
            const configPath = join(currentDir, configFile);
            if (existsSync(configPath)) {
                return configPath;
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
const program = new Command();
program
    .name('better-auth-studio')
    .description('Better Auth Studio - GUI dashboard for Better Auth')
    .version('1.0.0');
program
    .command('start')
    .description('Start Better Auth Studio')
    .option('-p, --port <port>', 'Port to run the studio on', '3002')
    .option('-h, --host <host>', 'Host to run the studio on', 'localhost')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
    try {
        console.log(chalk.blue('🔐 Better Auth Studio'));
        console.log(chalk.gray('Starting Better Auth Studio...\n'));
        const authConfig = await findAuthConfig();
        if (!authConfig) {
            console.error(chalk.red('❌ No Better Auth configuration found.'));
            console.log(chalk.yellow('Make sure you have a Better Auth configuration file in your project.'));
            console.log(chalk.yellow('Supported files: auth.ts, auth.js, better-auth.config.ts, etc.'));
            process.exit(1);
        }
        console.log(chalk.green('✅ Found Better Auth configuration'));
        let databaseInfo = 'Not configured';
        if (authConfig.database) {
            const configPath = await findAuthConfigPath();
            if (configPath) {
                const content = readFileSync(configPath, 'utf-8');
                if (content.includes('drizzleAdapter')) {
                    databaseInfo = 'Drizzle';
                }
                else if (content.includes('prismaAdapter')) {
                    databaseInfo = 'Prisma';
                }
                else if (authConfig.database.adapter && authConfig.database.provider) {
                    let adapter = authConfig.database.adapter;
                    const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
                    databaseInfo = adapterName;
                }
                else if (authConfig.database.type) {
                    databaseInfo = authConfig.database.type;
                }
                else if (authConfig.database.adapter) {
                    databaseInfo = authConfig.database.adapter;
                }
            }
            else {
                if (authConfig.database.adapter && authConfig.database.provider) {
                    let adapter = authConfig.database.adapter;
                    const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
                    databaseInfo = adapterName;
                }
                else if (authConfig.database.type) {
                    databaseInfo = authConfig.database.type;
                }
                else if (authConfig.database.adapter) {
                    databaseInfo = authConfig.database.adapter;
                }
            }
        }
        let providersInfo = 'None';
        if (authConfig.socialProviders && typeof authConfig.socialProviders === 'object') {
            const providerNames = Object.keys(authConfig.socialProviders);
            if (providerNames.length > 0) {
                providersInfo = providerNames.join(', ');
            }
        }
        else if (authConfig.providers && Array.isArray(authConfig.providers)) {
            const providerNames = authConfig.providers.map(p => p.type || p.name).filter(Boolean);
            if (providerNames.length > 0) {
                providersInfo = providerNames.join(', ');
            }
        }
        console.log(chalk.gray(`Database: ${databaseInfo}`));
        console.log(chalk.gray(`Providers: ${providersInfo}\n`));
        await startStudio({
            port: parseInt(options.port),
            host: options.host,
            openBrowser: options.open,
            authConfig
        });
    }
    catch (error) {
        console.error(chalk.red('❌ Failed to start Better Auth Studio:'), error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map