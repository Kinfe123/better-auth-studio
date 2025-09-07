#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startStudio } from './studio';
import { findAuthConfig } from './config';

const program = new Command();

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
      console.log(chalk.gray(`Database: ${authConfig.database?.type || 'Not configured'}`));
      console.log(chalk.gray(`Providers: ${authConfig.providers?.map(p => p.type).join(', ') || 'None'}\n`));

      await startStudio({
        port: parseInt(options.port),
        host: options.host,
        openBrowser: options.open,
        authConfig
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to start Better Auth Studio:'), error);
      process.exit(1);
    }
  });

program.parse();
