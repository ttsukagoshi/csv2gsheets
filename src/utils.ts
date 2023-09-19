// Utility functions

import fs from 'fs';
import { drive_v3 } from 'googleapis';
import inquirer, { QuestionCollection } from 'inquirer';
import path from 'path';

import { Config, CONFIG_FILE_NAME, DEFAULT_CONFIG } from './constants';
import { C2gError } from './c2g-error';
import { MESSAGES } from './messages';

/**
 * Check if the given source directory is valid.
 * @param sourceDir The source directory to validate
 * @returns `true` if the source directory is valid, or a string containing the error message if it isn't
 */
export function validateSourceDir(sourceDir: string): boolean | string {
  if (fs.existsSync(sourceDir)) {
    return true;
  } else {
    return MESSAGES.prompt.enterValidPath;
  }
}

/**
 * Check if the given target Google Drive folder ID is a string of length > 0.
 * @param id The target Google Drive folder ID to validate
 * @returns `true` if the target Google Drive folder ID is valid, or a string containing the error message if it isn't
 */
export function validateTargetDriveFolderId(id: string): boolean | string {
  if (id.length) {
    return true;
  } else {
    return MESSAGES.prompt.enterValidId;
  }
}

/**
 * Creates a config file in the current directory based on user input
 */
export async function createConfigFile(): Promise<void> {
  // Define the questions to be asked
  const questions: QuestionCollection = [
    {
      name: 'sourceDir',
      type: 'input',
      message: MESSAGES.prompt.enterSourceDir,
      default: DEFAULT_CONFIG.sourceDir,
      validate: validateSourceDir,
    },
    {
      name: 'targetDriveFolderId',
      type: 'input',
      message: MESSAGES.prompt.enterTargetDriveFolderId,
      default: DEFAULT_CONFIG.targetDriveFolderId,
      validate: validateTargetDriveFolderId,
    },
    {
      name: 'targetIsSharedDrive',
      type: 'confirm',
      message: MESSAGES.prompt.targetIsSharedDriveYN,
      default: DEFAULT_CONFIG.targetIsSharedDrive,
    },
    {
      name: 'updateExistingGoogleSheets',
      type: 'confirm',
      message: MESSAGES.prompt.updateExistingGoogleSheetsYN,
      default: DEFAULT_CONFIG.updateExistingGoogleSheets,
    },
    {
      name: 'saveOriginalFilesToDrive',
      type: 'confirm',
      message: MESSAGES.prompt.saveOriginalFilesToDriveYN,
      default: DEFAULT_CONFIG.saveOriginalFilesToDrive,
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
 * Note that this function does not check if the target Google Drive folder exists
 * or if the user has access to that folder.
 * @param configObj The contents of the configuration file as an object
 */
export function validateConfig(configObj: Partial<Config>): Config {
  if (configObj.sourceDir) {
    // If sourceDir is not a string, return false
    if (typeof configObj.sourceDir !== 'string') {
      throw new TypeError(MESSAGES.error.typeErrorSourceDirMustBeString);
    }
    // If sourceDir is not a valid path, return false
    if (!fs.existsSync(configObj.sourceDir)) {
      throw new C2gError(MESSAGES.error.c2gErrorSourceDirMustBeValidPath);
    }
  }
  if (configObj.targetDriveFolderId) {
    // If targetDriveFolderId is not a string, return false
    if (typeof configObj.targetDriveFolderId !== 'string') {
      throw new TypeError(
        MESSAGES.error.typeErrorTargetDriveFolderIdMustBeString,
      );
    }
  }
  if (configObj.targetIsSharedDrive) {
    // If targetIsSharedDrive is not a boolean, return false
    if (typeof configObj.targetIsSharedDrive !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorTargetIsSharedDriveMustBeBoolean,
      );
    }
  }
  if (configObj.updateExistingGoogleSheets) {
    // If updateExistingGoogleSheets is not a boolean, return false
    if (typeof configObj.updateExistingGoogleSheets !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorUpdateExistingGoogleSheetsMustBeBoolean,
      );
    }
  }
  if (configObj.saveOriginalFilesToDrive) {
    // If saveOriginalFilesToDrive is not a boolean, return false
    if (typeof configObj.saveOriginalFilesToDrive !== 'boolean') {
      throw new TypeError(
        MESSAGES.error.typeErrorSaveOriginalFilesToDriveMustBeBoolean,
      );
    }
  }
  const config = Object.assign({}, DEFAULT_CONFIG, configObj);
  return config;
}

/**
 * Check if the given target Google Drive folder ID is "root" (case-insensitive).
 * If it is, return true. Here, "root" is a special value that refers to the root folder
 * in My Drive.
 * @param targetDriveFolderId The target Google Drive folder ID
 * @returns `true` if the target Google Drive folder ID is "root", or `false` if it isn't
 */
export function isRoot(targetDriveFolderId: string): boolean {
  return targetDriveFolderId.toLowerCase() === 'root';
}

/**
 * Get the file names of all Google Sheets files in the target Google Drive folder.
 * Iterate through all pages of the results if nextPageToken is present.
 * If `config.updateExistingGoogleSheets` in the given `config` is `false`, return an empty array.
 * @param config The configuration object defined in `c2g.config.json`
 * @returns An array of objects containing the file ID and name of each Google Sheets file in the target Google Drive folder
 */
export async function getExistingSheetsFiles(
  drive: drive_v3.Drive,
  config: Config,
  fileList: drive_v3.Schema$File[] = [],
  nextPageToken?: string,
): Promise<drive_v3.Schema$File[]> {
  if (config.updateExistingGoogleSheets) {
    const params: drive_v3.Params$Resource$Files$List = {
      supportsAllDrives: config.targetIsSharedDrive,
      q: `'${config.targetDriveFolderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
    };
    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }
    const existingSheetsFilesObj = await drive.files.list(params);
    if (existingSheetsFilesObj.data?.files) {
      fileList = fileList.concat(existingSheetsFilesObj.data.files);
      if (existingSheetsFilesObj.data.nextPageToken) {
        fileList = await getExistingSheetsFiles(
          drive,
          config,
          fileList,
          existingSheetsFilesObj.data.nextPageToken,
        );
      }
    }
  }
  return fileList;
}

/**
 * Get the full path of each CSV file in the given directory and return them as an array.
 * @param sourceDir The path to the source directory to look for CSV files
 * @returns An array of full paths of CSV files in the source directory
 */
export function getLocalCsvFilePaths(sourceDir: string): string[] {
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

/**
 * Check if the given CSV file name exists in the given Google Drive folder
 * and return the Google Sheets file ID if it does.
 * If it doesn't, return null.
 * @param csvFileName The name of the CSV file
 * @param existingSheetsFilesObj The object containing the file names of all Google Sheets files in the target Google Drive folder
 * @returns The Google Sheets file ID if the CSV file name exists in the target Google Drive folder, or null if it doesn't
 */
export function getExistingSheetsFileId(
  csvFileName: string,
  existingSheetsFiles: drive_v3.Schema$File[],
): string | null {
  if (existingSheetsFiles.length > 0) {
    const existingSheetsFile = existingSheetsFiles.find(
      (file: drive_v3.Schema$File) => file.name === csvFileName,
    );
    return existingSheetsFile?.id ? existingSheetsFile.id : null;
  } else {
    return null;
  }
}

/**
 * Get the Google Drive folder ID of the "csv" folder in the target Google Drive folder.
 * If a folder named "csv" does not exist, create it.
 * If `config.saveOriginalFilesToDrive` in the given `config` is `false`, return `null`.
 * @param drive The Google Drive API v3 instance created by `google.drive({ version: 'v3', auth })`
 * @param config The configuration object defined in `c2g.config.json`
 * @returns The Google Drive folder ID of the "csv" folder in the target Google Drive folder,
 * or `null` if the given `config.saveOriginalFilesToDrive` is `false`
 */
export async function getCsvFolderId(
  drive: drive_v3.Drive,
  config: Config,
): Promise<string | null> {
  let csvFolderId: string | null = null;
  if (config.saveOriginalFilesToDrive) {
    // First, check if the "csv" folder exists
    const csvFolderList = await drive.files.list({
      supportsAllDrives: config.targetIsSharedDrive,
      q: `name = 'csv' and '${config.targetDriveFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    // If the "csv" folder does not exist, create it
    if (
      !csvFolderList.data?.files ||
      csvFolderList.data.files.length === 0 ||
      !csvFolderList.data.files[0].id
    ) {
      const newCsvFolderRequestBody: drive_v3.Schema$File = {
        name: 'csv',
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (isRoot(config.targetDriveFolderId)) {
        newCsvFolderRequestBody.parents = [config.targetDriveFolderId];
      }
      const newCsvFolder = await drive.files.create({
        supportsAllDrives: config.targetIsSharedDrive,
        requestBody: newCsvFolderRequestBody,
      });

      if (!newCsvFolder.data.id) {
        throw new C2gError(MESSAGES.error.c2gErrorFailedToCreateCsvFolder);
      }
      csvFolderId = newCsvFolder.data.id;
    } else {
      // If the "csv" folder exists, use its ID
      csvFolderId = csvFolderList.data.files[0].id;
    }
  }
  return csvFolderId;
}
