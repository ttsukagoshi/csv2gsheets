#!/usr/bin/env node

import loudRejection from 'loud-rejection';
import { program } from 'commander';

// Local imports
import { X2sError } from './x2s-error.js';
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
  'Output the current version'
);
program
  .name(`${PACKAGE_JSON?.name || 'xlsx2sheets'}`)
  .usage('<command> [options]')
  .description(
    `${PACKAGE_JSON?.name} - ${PACKAGE_JSON?.description}\nUse \`x2s\` for shorthand.`
  );

// Init command
program
  .command('init')
  .description('Create a configuration file in the current directory')
  .option(
    '-l, --login',
    'Login to the Google service before creating the file. Same as `x2s init && x2s login`'
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
    'Convert local Excel files into Google Sheets files based on the config file'
  )
  .option(
    '-c, --config-file-path <path>',
    'Path to the configuration file. Default: x2s.config.json in the current working directory'
  )
  .option(
    '-d, --dry-run',
    'Dry run. Do not actually convert the files. Useful for testing the configuration file.'
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
    if (error instanceof X2sError) {
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
