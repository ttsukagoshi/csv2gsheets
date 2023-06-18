#!/usr/bin/env node

import loudRejection from 'loud-rejection';
import { program } from 'commander';

// Local imports
import { X2sError } from './x2s-error.js';
import { PACKAGE_JSON } from './constants.js';
import { spinner, stopSpinner } from './utils.js';

// Commands
import convert from './commands/convert.js';

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
  .name(`${PACKAGE_JSON?.name || 'xlsx2sheets'}, aka x2s`)
  .usage('<command> [options]')
  .description(`${PACKAGE_JSON?.name} - ${PACKAGE_JSON?.description}`);

// Convert command
program
  .command('convert')
  .description(
    'Convert local Excel files into Google Sheets files based on the configuration file'
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
