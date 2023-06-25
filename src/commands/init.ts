// init command

// Import the necessary modules
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { isAuthorized } from '../auth.js';
import { CONFIG_FILE_NAME, Config } from '../constants.js';
import login from './login.js';

// Define the data type of the questions to be asked
type Question = {
  name: string;
  type: string;
  message: string;
  validate?: (value: string) => boolean | string;
  default?: boolean;
};

// Define the questions to be asked
const questions: Question[] = [
  {
    name: 'sourceDir',
    type: 'input',
    message:
      'Enter the full path of the folder in which your .xlsx files are located.',
    validate: (value: string) => {
      if (fs.existsSync(value)) {
        return true;
      } else {
        return 'Please enter a valid path.';
      }
    },
  },
  {
    name: 'targetDriveFolderId',
    type: 'input',
    message:
      'Enter the ID of the Google Drive folder to which you want to upload your .xlsx files.',
    validate: (value: string) => {
      if (value.length) {
        return true;
      } else {
        return 'Please enter a valid ID.';
      }
    },
  },
  {
    name: 'updateExistingGoogleSheets',
    type: 'confirm',
    message: 'Do you want to update existing Google Sheets files? (y/n)',
    default: false,
  },
];

/**
 * Creates a config file in the current directory based on user input
 */
async function createConfigFile(): Promise<void> {
  // Prompt the user for input
  const answers: Config = await inquirer.prompt(questions);

  // Write the answers to a config file
  fs.writeFileSync(
    path.join(process.cwd(), CONFIG_FILE_NAME),
    JSON.stringify(answers, null, 2)
  );
}

type CommandOptions = {
  readonly login?: boolean;
};

/**
 * Create a config file `x2s.config.json` in the current directory.
 * If a config file already exists, prompt the user to overwrite it.
 * If the option "login" is true, authorize the user as well.
 * This is same as running `x2s init && x2s login`.
 */
export default async function init(options?: CommandOptions): Promise<void> {
  // If a config file already exists, prompt the user to overwrite it
  if (fs.existsSync(path.join(process.cwd(), CONFIG_FILE_NAME))) {
    const overwrite: { overwrite: boolean } = await inquirer.prompt([
      {
        name: 'overwrite',
        type: 'confirm',
        message: `A config file already exists in this directory. Do you want to overwrite it? (y/n)`,
        default: false,
      },
    ]);
    if (overwrite.overwrite) {
      await createConfigFile();
    } else {
      // exit without doing anything
      console.info('No changes were made.');
    }
  } else {
    await createConfigFile();
  }
  // If the option "login" is true, authorize the user
  if (options?.login) {
    await login({ status: true });
    if (!isAuthorized()) {
      console.info('Logging in...');
      await login();
      await login({ status: true });
    }
  }
}
