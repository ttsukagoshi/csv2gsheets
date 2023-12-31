#!/usr/bin/env node
/* eslint @typescript-eslint/no-floating-promises: ["error", { ignoreIIFE: true }] */

import { program } from 'commander';
import loudRejection from 'loud-rejection';
import updateNotifier from 'update-notifier';

// Local imports
import { C2gError } from './c2g-error';
import { PACKAGE_JSON } from './package';

// Commands
import convert from './commands/convert';
import init from './commands/init';
import login from './commands/login';
import logout from './commands/logout';

// Make unhandled promise rejections fail loudly instead of the default silent fail
loudRejection();

// Check for updates
const updates = updateNotifier({
  pkg: PACKAGE_JSON,
  updateCheckInterval: 0, // Notify user on every run if there are any updates
  // updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day = default
});

// Set global CLI configurations
program.storeOptionsAsProperties(false);

// Display package version
program.version(
  PACKAGE_JSON?.version ?? '0.0.0',
  '-v, --version',
  'Output the current version',
);
program
  .name(`${PACKAGE_JSON?.name ?? 'csv2gsheets'}`)
  .usage('<command> [options]')
  .description(
    `${PACKAGE_JSON?.name} - ${PACKAGE_JSON?.description}\nUse \`c2g\` for shorthand.`,
  );

// Init command
program
  .command('init')
  .description('Create a configuration file in the current directory')
  .option(
    '-l, --login',
    'Login to the Google service before creating the file. Same as `c2g init && c2g login`',
  )
  .action(init);

// Login command
program
  .command('login')
  .description('Login to the Google service')
  .option('-s, --status', 'Print who is logged in')
  .action(login);

// Logout command
program
  .command('logout')
  .description('Logout of the Google service')
  .action(logout);

// Convert command
program
  .command('convert')
  .description(
    'Convert local CSV files into Google Sheets files based on the config file',
  )
  .option(
    '-b, --browse',
    'Open the Google Drive folder in the default browser after the conversion is complete',
  )
  .option(
    '-c, --config-file-path <path>',
    'Path to the configuration file. Default: c2g.config.json in the current working directory',
  )
  .option(
    '-d, --dry-run',
    'Dry run. Do not actually convert the files. Useful for testing the configuration file.',
  )
  .action(convert);

// Entry point function
(async () => {
  try {
    // User input is provided from the command line arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof C2gError) {
      console.error(error.message);
    } else if (error instanceof Error) {
      process.exitCode = 1;
      console.error(error.message);
    } else {
      process.exitCode = 1;
      console.error('An unknown error occurred.', error);
    }
  } finally {
    // Notify user of updates, if there are any
    updates.notify();
  }
})();
