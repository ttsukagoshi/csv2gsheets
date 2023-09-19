// init command

// Import the necessary modules
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { isAuthorized } from '../auth';
import { CONFIG_FILE_NAME } from '../constants';
import login from './login';
import { MESSAGES } from '../messages';
import * as utils from '../utils';

interface InquirerInitOverwriteResponse {
  overwrite: boolean;
}

interface InitCommandOptions {
  readonly login?: boolean;
}

/**
 * Create a config file `c2g.config.json` in the current directory.
 * If a config file already exists, prompt the user to overwrite it.
 * If the option "login" is true, authorize the user as well.
 * This is same as running `c2g init && c2g login`.
 */
export default async function init(
  options?: InitCommandOptions,
): Promise<void> {
  // If a config file already exists, prompt the user to overwrite it
  if (fs.existsSync(path.join(process.cwd(), CONFIG_FILE_NAME))) {
    const overwrite = (await inquirer.prompt([
      {
        name: 'overwrite',
        type: 'confirm',
        message: MESSAGES.prompt.overwriteExistingConfigFileYN,
        default: false,
      },
    ])) as InquirerInitOverwriteResponse;
    if (overwrite.overwrite) {
      await utils.createConfigFile();
    } else {
      // exit without doing anything
      console.info(MESSAGES.log.noChangesWereMade);
    }
  } else {
    await utils.createConfigFile();
  }
  // If the option "login" is true, authorize the user
  if (options?.login) {
    await login({ status: true });
    if (!isAuthorized()) {
      console.info(MESSAGES.log.loggingIn);
      await login();
    }
  }
}
