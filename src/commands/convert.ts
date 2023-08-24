// Convert local Excel files into Google Sheets files based on the config file c2g.config.json
// By default, c2g.config.json in the current working directory will be looked for and used in subsequent processing.
// Alternatively, the path to the configuration file can be specified by the user in the command line option --config-file-path
// If the config file is not found, the program will exit with an error message.

// The format of the configuration file is defined in src/constants.ts as type Config
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

// Use the xlsx package to read Excel files
// Use the googleapis package to access Google Drive and Google Sheets

import fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

import { authorize, getUserEmail, isAuthorized } from '../auth.js';
import { Config, CONFIG_FILE_NAME } from '../constants.js';
import { MESSAGES } from '../messages.js';
import { C2gError } from '../c2g-error.js';

interface CommandOptions {
  readonly browse?: boolean;
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
}

interface DrivePermissionQueryParameters {
  readonly fileId: string;
  pageToken?: string;
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
    return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
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

/**
 * Check if the authorized user has editor permission to the given Google Drive folder ID.
 * If the user has access is able to edit its contents, return true.
 * If the folder ID is 'root', 'Root', or 'ROOT', return true as well.
 * @param folderId The ID of the Google Drive folder
 * @param auth The OAuth2client object
 * @returns true if the user has editor permission to the given Google Drive folder ID, or the ID is 'root'; false otherwise
 */
async function validateGoogleDriveFolderId(
  folderId: string,
  auth: OAuth2Client,
): Promise<boolean> {
  // If the folder ID is 'root', 'Root', or 'ROOT', return true
  if (folderId.toLowerCase() === 'root') {
    return true;
  } else {
    const drive = google.drive({ version: 'v3', auth: auth });
    // Check if the folder exists
    const folder = await drive.files.get({ fileId: folderId, fields: 'id' });
    if (!folder) {
      return false;
    }
    // Check if the user has permission to access the folder
    const permissions = await getDriveFilePermissions(folderId, auth);
    // [TODO] Check if the user has editor permission to the folder
    return true;
  }
}

/**
 * Get the full list of permissions in a given Google Drive file or folder.
 * @param fileId The ID of the Google Drive file or folder
 * @param auth The OAuth2client object
 * @param nextPageToken nextPageToken for the next page of results
 * @returns The full list of permissions in the given Google Drive file or folder
 * @see https://developers.google.com/drive/api/reference/rest/v3/permissions/list
 */
async function getDriveFilePermissions(
  fileId: string,
  auth: OAuth2Client,
  nextPageToken?: string,
) {
  const drive = google.drive({ version: 'v3', auth: auth });
  const queryParameters: DrivePermissionQueryParameters = {
    fileId: fileId,
  };
  if (nextPageToken) {
    queryParameters['pageToken'] = nextPageToken;
  }
  const returnPermissionsList = [];
  const permissions = await drive.permissions.list(queryParameters);
  if (!permissions || !permissions.data.permissions) {
    return undefined;
  }
  returnPermissionsList.push(...permissions.data.permissions);
  // If permissions has nextPageToken, get the next page of results recursively
  if (permissions.data.nextPageToken) {
    returnPermissionsList.push(
      ...(await getDriveFilePermissions(
        fileId,
        auth,
        permissions.data.nextPageToken,
      )),
    );
  }
  return returnPermissionsList; // [To-Do] Perhaps return just the user email and the role in an object using Array.reduce()?
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
  // Check if the target Google Drive folder exists
  if (!(await validateGoogleDriveFolderId(config.targetDriveFolderId, auth))) {
    throw new C2gError(MESSAGES.error.c2gErrorTargetDriveFolderIdInvalid);
  }
  // [TO-DO] Read the contents of sourceDir and check if there are any Excel files with the extension of .xlsx
  // [TO-DO] Read contents of each .xlsx files. For each file, check if there is an existing Google Sheets file with the same name in the target Google Drive folder
  // [TO-DO] If it exists, and the value of config.updateExistingGoogleSheets is true, update the existing Google Sheets file; if not, create a new Google Sheets file

  // Open the target Google Drive folder in the default browser if the --browse option is specified
  if (options.browse) {
    // Open the target Google Drive folder in the default browser
    const url =
      config.targetDriveFolderId.toLowerCase() === 'root'
        ? 'https://drive.google.com/drive/my-drive'
        : `https://drive.google.com/drive/folders/${config.targetDriveFolderId}`;
    open(url);
  }
}
