// Messages for this tool

import { CREDENTIALS_FILE_NAME } from './constants.js';

export const MESSAGES = {
  error: {
    typeErrorSourceDirMustBeString:
      'The value of sourceDir in the configuration file must be a string.',
    typeErrorTargetDriveFolderIdMustBeString:
      'The value of targetDriveFolderId in the configuration file must be a string.',
    typeErrorUpdateExistingGoogleSheetsMustBeBoolean:
      'The value of updateExistingGoogleSheets in the configuration file must be a boolean, i.e., it must be either true or false.',
    typeErrorSaveOriginalFilesToDriveMustBeBoolean:
      'The value of saveOriginalFilesToDrive in the configuration file must be a boolean, i.e., it must be either true or false.',
    c2gErrorConfigFileNotFound:
      'Enter a valid path for the configuration file. You can create a new one by running the command `c2g init`.',
    c2gErrorCredentialsFileNotFound: `${CREDENTIALS_FILE_NAME} not found.`,
    c2gErrorInvalidCredentials: `Invalid credentials. Please check the structure of your ${CREDENTIALS_FILE_NAME}.`,
    c2gErrorNotLoggedIn: 'You are not logged in. Please run `c2g login`.',
    c2gErrorSourceDirMustBeValidPath:
      'The value of sourceDir in the configuration file must be a valid path.',
    c2gErrorTargetDriveFolderIdInvalid:
      'The target Google Drive folder ID is either invalid or you do not have access to it. Please check the ID and update the config file.',
    c2gErrorConfigFileMustContain4Properties:
      'The configuration file must contain the following four properties: sourceDir, targetDriveFolderId, updateExistingGoogleSheets, and saveOriginalFilesToDrive.',
  },
  log: {
    loggingIn: 'Logging in...',
    noChangesWereMade: 'No changes were made.',
    youHaveBeenLoggedOut: 'You have been logged out.',
    youAreLoggedInAs: (email: string) => `You are logged in as ${email}.`,
    youAreNotLoggedIn: 'You are not logged in.',
  },
  prompt: {
    enterSourceDir:
      'Enter the full path of the folder in which your CSV files are located.',
    enterTargetDriveFolderId:
      'Enter the ID of the Google Drive folder to which you want to upload your CSV files.',
    enterValidId: 'Please enter a valid ID.',
    enterValidPath: 'Please enter a valid path.',
    overwriteExistingConfigFileYN:
      'A config file already exists in this directory. Do you want to overwrite it? (y/n)',
    saveOriginalFilesToDriveYN:
      'Do you want to save the original CSV files to Google Drive? (y/n)',
    updateExistingGoogleSheetsYN:
      'Do you want to update existing Google Sheets files? (y/n)',
  },
};
