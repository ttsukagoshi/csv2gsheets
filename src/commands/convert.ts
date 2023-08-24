// Convert local CSV files into Google Sheets files based on the config file c2g.config.json
// By default, c2g.config.json in the current working directory will be looked for and used in subsequent processing.
// Alternatively, the path to the configuration file can be specified by the user in the command line option --config-file-path
// If the config file is not found, the program will exit with an error message.

// The format of the configuration file is defined in src/constants.ts as interface Config
// The configuration file is validated against this type before being used in subsequent processing.
// If the configuration file is not valid, the program will exit with an error message.
// The program will look in the directory specified by sourceDir in Config for Excel files with the extension of .xlsx,
// upload them to the Google Drive folder specified by targetFolderId in Config,
// and convert them into Google Sheets files.
// If the value of the updateExistingGoogleSheets in Config is true, the program will update existing Google Sheets files with the same name.
// If the value of the updateExistingGoogleSheets in Config is false, the program will create a new Google Sheets file instead.
// If the value of the targetFolderId in Config is "root", "Root", or "ROOT", the program will use the root folder of the user's Google Drive as its target folder.
// If the value of the saveOriginalFilesToDrive in Config is true, the program will save the original Excel files to Google Drive as well.

// If the --browse option is specified, the program will open the Google Drive folder in the default browser after the conversion is complete.

// Use the googleapis package to access Google Drive and Google Sheets

import fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

import { authorize, isAuthorized } from '../auth.js';
import { Config, CONFIG_FILE_NAME } from '../constants.js';
import { MESSAGES } from '../messages.js';
import { C2gError } from '../c2g-error.js';

interface CommandOptions {
  readonly browse?: boolean;
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
}

/**
 * Read the configuration file and return its contents as an object.
 * @param configFilePath The path to the configuration file
 * @returns The contents of the configuration file as an object
 */
function readConfigFileSync(configFilePath: string): Config {
  // Check if the configFilePath is a valid path
  if (!fs.existsSync(configFilePath)) {
    throw new C2gError(MESSAGES.error.c2gErrorConfigFileNotFound);
  } else {
    // Read the configuration file and return its contents as an object
    const parsedConfig = JSON.parse(
      fs.readFileSync(configFilePath, 'utf8'),
    ) as Config;
    return parsedConfig;
  }
}

/**
 * Validate the configuration file.
 *
 * Note that this function does not check if the target Google Drive folder exists.
 * Validation of the Google Drive folder ID requires user authorization.
 * It is done in the main function, after the authorization is complete.
 * @param configObj The contents of the configuration file as an object
 */
function validateConfig(configObj: Config): Config {
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
        MESSAGES.error.typeErrorTargetDriveFolderIdMustBeString,
      );
    }
    // If updateExistingGoogleSheets is not a boolean, return false
    if (typeof configObj.updateExistingGoogleSheets !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorUpdateExistingGoogleSheetsMustBeBoolean,
      );
    }
    // If saveOriginalFilesToDrive is not a boolean, return false
    if (typeof configObj.saveOriginalFilesToDrive !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorSaveOriginalFilesToDriveMustBeBoolean,
      );
    }
    // Check the validity of the values of the properties
    // If sourceDir is not a valid path, return false
    if (!fs.existsSync(configObj.sourceDir)) {
      throw new C2gError(MESSAGES.error.c2gErrorSourceDirMustBeValidPath);
    }
    return configObj;
  } else {
    throw new C2gError(MESSAGES.error.c2gErrorConfigFileMustContain4Properties);
  }
}

export default async function (options: CommandOptions): Promise<void> {
  console.log('running convert. options:', options); // [test]
  // Checks if the user is already logged in
  if (!isAuthorized()) {
    throw new C2gError(MESSAGES.error.c2gErrorNotLoggedIn);
  }
  // If configFilePath is not specified, use the CONFIG_FILE_NAME in the current working directory
  const configFilePath = options.configFilePath
    ? options.configFilePath
    : path.join(process.cwd(), CONFIG_FILE_NAME);
  // Read the configuration file and validate its contents
  const config = validateConfig(readConfigFileSync(configFilePath));
  console.log('config:', config); // [test]
  // Authorize the user
  const auth = await authorize();

  // Read the contents of sourceDir and check if there are any CSV files with the extension of .csv
  const csvFiles = [];
  if (config.sourceDir.endsWith('.csv')) {
    // If sourceDir is a single CSV file, simply add it to csvFiles
    // Note that the value of config.sourceDir is already validated in validateConfig()
    csvFiles.push(config.sourceDir);
  } else {
    // If sourceDir is a directory containing CSV files, add the full path of each CSV file to csvFiles
    const files = fs.readdirSync(config.sourceDir);
    files.forEach((file) => {
      const fileLower = file.toLowerCase();
      if (fileLower.endsWith('.csv')) {
        csvFiles.push(path.join(config.sourceDir, file));
      }
    });
  }
  // If there are no CSV files, exit the program with a message
  if (csvFiles.length === 0) {
    throw new C2gError(MESSAGES.error.c2gErrorNoCsvFilesFound);
  }

  csvFiles.forEach((csvFile) => {
    // Read contents of each .csv files.
    // For each file, check if there is an existing Google Sheets file with the same name in the target Google Drive folder
    // [TO-DO] If it exists, and the value of config.updateExistingGoogleSheets is true, update the existing Google Sheets file; if not, create a new Google Sheets file
  });

  // Open the target Google Drive folder in the default browser if the --browse option is specified
  if (options.browse) {
    const url =
      config.targetDriveFolderId.toLowerCase() === 'root'
        ? 'https://drive.google.com/drive/my-drive'
        : `https://drive.google.com/drive/folders/${config.targetDriveFolderId}`;
    open(url);
  }
}
