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
// import { OAuth2Client } from 'google-auth-library';
import path from 'path';

import { authorize, isAuthorized } from '../auth';
import { Config, CONFIG_FILE_NAME } from '../constants';
import { MESSAGES } from '../messages';
import { C2gError } from '../c2g-error';

interface ConvertCommandOptions {
  readonly browse?: boolean;
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
}

/**
 * Read the configuration file and return its contents as an object.
 * @param configFilePath The path to the configuration file
 * @returns The contents of the configuration file as an object
 */
export function readConfigFileSync(configFilePath: string): Config {
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
export function validateConfig(configObj: Config): Config {
  // Check if the configObj conforms with the Config type
  if (
    'sourceDir' in configObj &&
    'targetDriveFolderId' in configObj &&
    'updateExistingGoogleSheets' in configObj &&
    'saveOriginalFilesToDrive' in configObj
  ) {
    // Check configObj for data types
    // If sourceDir is not a string, return false
    if (typeof configObj.sourceDir !== 'string') {
      throw new TypeError(MESSAGES.error.typeErrorSourceDirMustBeString);
    }
    // If targetDriveFolderId is not a string, return false
    if (typeof configObj.targetDriveFolderId !== 'string') {
      throw new TypeError(
        MESSAGES.error.typeErrorTargetDriveFolderIdMustBeString,
      );
    }
    // If targetIsSharedDrive is not a boolean, return false
    if (typeof configObj.targetIsSharedDrive !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorTargetIsSharedDriveMustBeBoolean,
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
    throw new C2gError(MESSAGES.error.c2gErrorConfigFileMustContain5Properties);
  }
}

/**
 * Get the full path of each CSV file in the given directory and return them as an array.
 * @param sourceDir The path to the source directory to look for CSV files
 * @returns An array of full paths of CSV files in the source directory
 */
export function getCsvFilePaths(sourceDir: string): string[] {
  // Read the contents of sourceDir and check if there are any CSV files with the extension of .csv
  const csvFiles = [];
  const sourceDirLower = sourceDir.toLowerCase();
  if (sourceDirLower.endsWith('.csv')) {
    // If sourceDir is a single CSV file, simply add it to csvFiles
    // Note that the value of sourceDir should be processed through validateConfig() before calling this function
    csvFiles.push(sourceDir);
  } else {
    // If sourceDir is a directory containing CSV files, add the full path of each CSV file to csvFiles
    const files = fs.readdirSync(sourceDir);
    files.forEach((file) => {
      const fileLower = file.toLowerCase();
      if (fileLower.endsWith('.csv')) {
        csvFiles.push(path.join(sourceDir, file));
      }
    });
  }
  return csvFiles;
}

export default async function convert(
  options: ConvertCommandOptions,
): Promise<void> {
  if (!options.dryRun && !isAuthorized()) {
    // If the --dry-run option is NOT specified and the user is NOT logged in,
    // exit the program with an error message
    throw new C2gError(MESSAGES.error.c2gErrorNotLoggedIn);
  }
  // If configFilePath is not specified in the options, use the CONFIG_FILE_NAME in the current working directory
  const configFilePath = options.configFilePath
    ? options.configFilePath
    : path.join(process.cwd(), CONFIG_FILE_NAME);
  // Read the configuration file and validate its contents
  const config = validateConfig(readConfigFileSync(configFilePath));

  console.log('config:', config); // [test]

  // Authorize the user
  const auth = await authorize();

  const drive = google.drive({ version: 'v3', auth });
  /*
  // [TEST] Use the Drive API to get the metadata of the target Google Drive folder
  const driveFolder = await drive.files.get({
    supportsAllDrives: config.targetIsSharedDrive,
    fileId: config.targetDriveFolderId,
    fields: 'id, name, mimeType, parents',
  });
  console.log('driveFolder:', driveFolder); // [test]
  */

  // Get the full path of each CSV file in the source directory
  const csvFiles = getCsvFilePaths(config.sourceDir);
  if (csvFiles.length === 0) {
    // If there are no CSV files, exit the program with a message
    throw new C2gError(MESSAGES.error.c2gErrorNoCsvFilesFound);
  }
  // Based on csvFiles, search the Google Drive folder for existing Google Sheets files with the same name
  //

  for (const csvFile of csvFiles) {
    if (!options.dryRun) {
      // When the --dry-run option is NOT specified, upload the CSV file to Google Drive
      // First, read the CSV file
      const csvData = fs.createReadStream(csvFile);
      if (condition) {
        // Create a Google Sheets file from the CSV file
        await drive.files.create({
          supportsAllDrives: config.targetIsSharedDrive,
          requestBody: {
            name: path.basename(csvFile),
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [config.targetDriveFolderId],
          },
          media: {
            mimeType: 'text/csv',
            body: csvData,
          },
        });
      }
      if (config.saveOriginalFilesToDrive) {
        // If saveOriginalFilesToDrive is true, upload the original CSV file to Google Drive as well
        // The CSV file should be uploaded to the "csv" folder in the target Google Drive folder
        let targetCsvFolderId = '';
        // First, check if the "csv" folder exists
        const csvFolder = await drive.files.list({
          supportsAllDrives: config.targetIsSharedDrive,
          q: `name = 'csv' and '${config.targetDriveFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
          fields: 'files(id, name, mimeType, parents)',
        });
        console.log('csvFolder:', csvFolder); // [test]
        // If the "csv" folder does not exist, create it
        if (!csvFolder.data?.files || csvFolder.data.files.length === 0) {
          const newCsvFolder = await drive.files.create({
            supportsAllDrives: config.targetIsSharedDrive,
            requestBody: {
              name: 'csv',
              mimeType: 'application/vnd.google-apps.folder',
              parents: [config.targetDriveFolderId],
            },
          });
          console.log('newCsvFolder:', newCsvFolder); // [test]
          if (!newCsvFolder.data.id) {
            throw new C2gError(MESSAGES.error.c2gErrorFailedToCreateCsvFolder);
          }
          targetCsvFolderId = newCsvFolder.data.id;
        } else {
          // If the "csv" folder exists, use its ID
          targetCsvFolderId = csvFolder.data.files[0].id as string;
        }
        // Upload the CSV file to the "csv" folder
        await drive.files.create({
          supportsAllDrives: config.targetIsSharedDrive,
          requestBody: {
            name: path.basename(csvFile),
            mimeType: 'text/csv',
            parents: [targetCsvFolderId],
          },
          media: {
            mimeType: 'text/csv',
            body: csvData,
          },
        });
      }
    } else {
      // When on dry run, just log the file name without uploading it
      console.info('[Dry Run] Source CSV: ', csvFile);
    }
  }

  // Open the target Google Drive folder in the default browser if the --browse option is specified
  if (options.browse) {
    const url =
      config.targetDriveFolderId.toLowerCase() === 'root'
        ? 'https://drive.google.com/drive/my-drive'
        : `https://drive.google.com/drive/folders/${config.targetDriveFolderId}`;
    open(url);
  }
}
