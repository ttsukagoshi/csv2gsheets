// init command

// Import the necessary modules
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { isAuthorized } from '../auth';
import { Config, CONFIG_FILE_NAME } from '../constants';
import login from './login';
import { MESSAGES } from '../messages';

// Define the data type of the questions to be asked
interface Question {
  name: string;
  type: string;
  message: string;
  validate?: (value: string) => boolean | string;
  default?: boolean;
}

interface InquirerInitOverwriteResponse {
  overwrite: boolean;
}

interface InitCommandOptions {
  readonly login?: boolean;
}

/**
 * Creates a config file in the current directory based on user input
 */
async function createConfigFile(): Promise<void> {
  // Define the questions to be asked
  const questions: Question[] = [
    {
      name: 'sourceDir',
      type: 'input',
      message: MESSAGES.prompt.enterSourceDir,
      validate: (value: string) => {
        if (fs.existsSync(value)) {
          return true;
        } else {
          return MESSAGES.prompt.enterValidPath;
        }
      },
    },
    {
      name: 'targetDriveFolderId',
      type: 'input',
      message: MESSAGES.prompt.enterTargetDriveFolderId,
      validate: (value: string) => {
        if (value.length) {
          return true;
        } else {
          return MESSAGES.prompt.enterValidId;
        }
      },
    },
    {
      name: 'targetIsSharedDrive',
      type: 'confirm',
      message: MESSAGES.prompt.targetIsSharedDriveYN,
      default: false,
    },
    {
      name: 'updateExistingGoogleSheets',
      type: 'confirm',
      message: MESSAGES.prompt.updateExistingGoogleSheetsYN,
      default: false,
    },
    {
      name: 'saveOriginalFilesToDrive',
      type: 'confirm',
      message: MESSAGES.prompt.saveOriginalFilesToDriveYN,
      default: true,
    },
  ];

  // Prompt the user for input
  const answers = (await inquirer.prompt(questions)) as Config;

  // Write the answers to a config file
  fs.writeFileSync(
    path.join(process.cwd(), CONFIG_FILE_NAME),
    JSON.stringify(answers, null, 2),
  );
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
      await createConfigFile();
    } else {
      // exit without doing anything
      console.info(MESSAGES.log.noChangesWereMade);
    }
  } else {
    await createConfigFile();
  }
  // If the option "login" is true, authorize the user
  if (options?.login) {
    await login({ status: true });
    if (!isAuthorized()) {
      console.info(MESSAGES.log.loggingIn);
      await login();
      await login({ status: true });
    }
  }
}
