// Create a config file in the current directory
// When called, this command should prompt a series of questions to the user
// on the command line and then write a config file to the current directory
// The questions to be asked are:
// - Enter the full path of the folder in which your .xlsx files are located. xlsx2gsheets will upload all .xlsx files in this folder to Google Drive.
// - Enter the ID of the Google Drive folder to which you want to upload your .xlsx files.
// - Do you want to update existing Google Sheets files? (y/n)
// Use the inquirer package to prompt the user for input

// Import the necessary modules
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { CONFIG_FILE_NAME } from '../constants.js';

// Define the questions to be asked
const questions = [
  {
    name: 'sourceDir',
    type: 'input',
    message:
      'Enter the full path of the folder in which your .xlsx files are located. xlsx2gsheets will upload all .xlsx files in this folder to Google Drive.',
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
  const answers = await inquirer.prompt(questions);

  // Write the answers to a config file
  fs.writeFileSync(
    path.join(process.cwd(), CONFIG_FILE_NAME),
    JSON.stringify(answers, null, 2)
  );
}

export default async function init(): Promise<void> {
  // Checks if a config file already exists
  // If it does, prompt the user to overwrite it
  if (fs.existsSync(path.join(process.cwd(), CONFIG_FILE_NAME))) {
    const overwrite = await inquirer.prompt([
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
}
