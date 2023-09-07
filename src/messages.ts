// Messages for this tool

import { CREDENTIALS_FILE_NAME } from './constants';

export const MESSAGES = {
  error: {
    typeErrorSourceDirMustBeString:
      'The value of sourceDir in the configuration file must be a string.',
    typeErrorTargetDriveFolderIdMustBeString:
      'The value of targetDriveFolderId in the configuration file must be a string.',
    typeErrorTargetIsSharedDriveMustBeBoolean:
      'The value of targetIsSharedDrive in the configuration file must be a boolean, i.e., it must be either true or false.',
    typeErrorUpdateExistingGoogleSheetsMustBeBoolean:
      'The value of updateExistingGoogleSheets in the configuration file must be a boolean, i.e., it must be either true or false.',
    typeErrorSaveOriginalFilesToDriveMustBeBoolean:
      'The value of saveOriginalFilesToDrive in the configuration file must be a boolean, i.e., it must be either true or false.',
    c2gErrorConfigFileMustContain5Properties:
      'The configuration file must contain the following five properties: sourceDir, targetDriveFolderId, updateExistingGoogleSheets, and saveOriginalFilesToDrive.',
    c2gErrorConfigFileNotFound:
      'Enter a valid path for the configuration file. You can create a new one by running the command `c2g init`.',
    c2gErrorCredentialsFileNotFound: `${CREDENTIALS_FILE_NAME} not found.`,
    c2gErrorInvalidCredentials: `Invalid credentials. Please check the structure of your ${CREDENTIALS_FILE_NAME}.`,
    c2gErrorFailedToCreateCsvFolder:
      'Failed to create CSV folder for some reason. Please try again.',
    c2gErrorNoCsvFilesFound: 'No CSV files found.',
    c2gErrorNotLoggedIn: 'You are not logged in. Please run `c2g login`.',
    c2gErrorSourceDirMustBeValidPath:
      'The value of sourceDir in the configuration file must be a valid path.',
  },
  log: {
    convertingCsvWithFollowingSettings: (configStr: string) =>
      `Converting local CSV to Google Sheet with the following settings:\n${configStr}`,
    loggingIn: 'Logging in...',
    noChangesWereMade: 'No changes were made.',
    runningOnDryRun: 'Running on dry-run mode. No actual changes will be made.',
    youHaveBeenLoggedOut: 'You have been logged out.',
    youAreLoggedInAs: (email: string) => `You are logged in as ${email}.`,
    youAreNotLoggedIn: 'You are not logged in.',
  },
  prompt: {
    enterSourceDir:
      'Enter the full path of the folder in which your CSV files are located.',
    enterTargetDriveFolderId:
      'Enter the ID of the Google Drive folder to which you want to upload your CSV files.',
    enterValidId:
      'Please enter a valid ID. If you want to target the root folder in My Drive, enter "root".',
    enterValidPath: 'Please enter a valid path.',
    overwriteExistingConfigFileYN:
      'A config file already exists in this directory. Do you want to overwrite it?',
    saveOriginalFilesToDriveYN:
      'Do you want to save the original CSV files to Google Drive?',
    targetIsSharedDriveYN: 'Is the target folder a Shared Drive?',
    updateExistingGoogleSheetsYN:
      'Do you want to update existing Google Sheets files?',
  },
};
