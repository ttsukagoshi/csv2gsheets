// Convert local Excel files into Google Sheets files based on the config file x2s.config.json
// By default, x2s.config.json in the current working directory will be looked for and used in subsequent processing.
// Alternatively, the path to the configuration file can be specified by the user in the command line option --config-file-path
// If the config file is not found, the program will exit with an error message.

// The format of the configuration file is defined in src\constants.ts as type Config
// The configuration file is validated against this type before being used in subsequent processing.
// If the configuration file is not valid, the program will exit with an error message.
// The program will look in the directory specified by sourceDir in Config for Excel files with the extension of .xlsx,
// upload them to the Google Drive folder specified by targetFolderId in Config,
// and convert them into Google Sheets files.
// If the value of the updateExistingGoogleSheets in Config is true, the program will update existing Google Sheets files with the same name.
// If the value of the updateExistingGoogleSheets in Config is false, the program will create a new Google Sheets file instead.
// If the value of the targetFolderId in Config is "root", "Root", or "ROOT", the program will use the root folder of the user's Google Drive as its target folder.
// If the value of the saveOriginalFilesToDrive in Config is true, the program will save the original Excel files to Google Drive as well.

import fs from 'fs';

import { authorize } from '../auth.js';
import { Config } from '../constants.js';
import { MESSAGES } from '../messages.js';
import { X2sError } from '../x2s-error.js';

type CommandOptions = {
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
};

/**
 * Validate the configuration file
 * @param configObj The contents of the configuration file as an object
 */
function validateConfig(configObj: any): Config {
  // Check if the configObj conforms with the Config type
  if (
    configObj.sourceDir &&
    configObj.targetDriveFolderId &&
    configObj.updateExistingGoogleSheets &&
    configObj.saveOriginalFilesToDrive
  ) {
    // Check configObj for data types
    // If sourceDir is not a string, return false
    if (typeof configObj.sourceDir !== 'string') {
      throw new TypeError('');
    }
    // If targetDriveFolderId is not a string, return false
    if (typeof configObj.targetDriveFolderId !== 'string') {
      throw new TypeError(
        MESSAGES.error.typeErrorTargetDriveFolderIdMustBeString
      );
    }
    // If updateExistingGoogleSheets is not a boolean, return false
    if (typeof configObj.updateExistingGoogleSheets !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorUpdateExistingGoogleSheetsMustBeBoolean
      );
    }
    // If saveOriginalFilesToDrive is not a boolean, return false
    if (typeof configObj.saveOriginalFilesToDrive !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorSaveOriginalFilesToDriveMustBeBoolean
      );
    }
    // Check the validity of the values of the properties
    // If sourceDir is not a valid path, return false
    if (!fs.existsSync(configObj.sourceDir)) {
      throw new X2sError(MESSAGES.error.x2sErrorSourceDirMustBeValidPath);
    }
    // If targetDriveFolderId is not a valid ID, return false

    return configObj;
  } else {
    throw new X2sError(MESSAGES.error.x2sErrorConfigFileMustContain4Properties);
  }
}

export default async function (options: CommandOptions): Promise<void> {
  console.log('running convert. options:', options); // [test]
}
