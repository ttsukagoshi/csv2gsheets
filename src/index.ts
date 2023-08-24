#!/usr/bin/env node
/* eslint @typescript-eslint/no-floating-promises: ["error", { ignoreIIFE: true }] */

import loudRejection from 'loud-rejection';
import { program } from 'commander';

// Local imports
import { C2gError } from './c2g-error.js';
import { PACKAGE_JSON } from './package.js';
import { spinner, stopSpinner } from './utils.js';

// Commands
import convert from './commands/convert.js';
import init from './commands/init.js';
import login from './commands/login.js';
import logout from './commands/logout.js';

// Make unhandled promise rejections fail loudly instead of the default silent fail
loudRejection();

// Set global CLI configurations
program.storeOptionsAsProperties(false);

// Display package version
program.version(
  PACKAGE_JSON?.version || '0.0.0',
  '-v, --version',
  'Output the current version',
);
program
  .name(`${PACKAGE_JSON?.name || 'csv2gsheets'}`)
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
    stopSpinner();
  } catch (error) {
    // Handle errors
    stopSpinner();
    if (error instanceof C2gError) {
      console.error(error.message);
    } else if (error instanceof Error) {
      process.exitCode = 1;
      console.error(error.message);
    } else {
      process.exitCode = 1;
      console.error('An unknown error occurred.', error);
    }
  }
  spinner.clear();
})();
