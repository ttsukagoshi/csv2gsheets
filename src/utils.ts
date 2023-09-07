// Utility functions

import ora from 'ora';

/**
 * ora - The elegant terminal spinner
 * @see https://www.npmjs.com/package/ora
 */
export const spinner = ora(); // New spinner instance

/**
 * Stop the spinner if it is running
 */
export function stopSpinner(): void {
  if (spinner.isSpinning) {
    spinner.stop();
  }
}
