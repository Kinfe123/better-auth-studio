#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const studio_1 = require("./studio");
const config_1 = require("./config");
const program = new commander_1.Command();
program
    .name('better-auth-studio')
    .description('Better Auth Studio - GUI dashboard for Better Auth')
    .version('1.0.0');
program
    .command('studio')
    .description('Start Better Auth Studio')
    .option('-p, --port <port>', 'Port to run the studio on', '3001')
    .option('-h, --host <host>', 'Host to run the studio on', 'localhost')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔐 Better Auth Studio'));
        console.log(chalk_1.default.gray('Starting Better Auth Studio...\n'));
        const authConfig = await (0, config_1.findAuthConfig)();
        if (!authConfig) {
            console.error(chalk_1.default.red('❌ No Better Auth configuration found.'));
            console.log(chalk_1.default.yellow('Make sure you have a Better Auth configuration file in your project.'));
            console.log(chalk_1.default.yellow('Supported files: auth.ts, auth.js, better-auth.config.ts, etc.'));
            process.exit(1);
        }
        console.log(chalk_1.default.green('✅ Found Better Auth configuration'));
        console.log(chalk_1.default.gray(`Database: ${authConfig.database?.type || 'Not configured'}`));
        console.log(chalk_1.default.gray(`Providers: ${authConfig.providers?.map(p => p.type).join(', ') || 'None'}\n`));
        await (0, studio_1.startStudio)({
            port: parseInt(options.port),
            host: options.host,
            openBrowser: options.open,
            authConfig
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to start Better Auth Studio:'), error);
        process.exit(1);
    }
});
program.parse();