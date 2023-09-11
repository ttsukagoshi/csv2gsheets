// convert command

import fs from 'fs';
import { google, drive_v3 } from 'googleapis';
import open from 'open';
import path from 'path';

import { authorize, isAuthorized } from '../auth';
import { C2gError } from '../c2g-error';
import { Config, CONFIG_FILE_NAME } from '../constants';
import { MESSAGES } from '../messages';

interface ConvertCommandOptions {
  readonly browse?: boolean;
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
}

interface CsvFileObj {
  name: string;
  basename: string;
  path: string;
  existingSheetsFileId: string | null;
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
    'targetIsSharedDrive' in configObj &&
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
 * Get the file names of all Google Sheets files in the target Google Drive folder.
 * Iterate through all pages of the results.
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
      fields: 'files(id, name)',
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
      const newCsvFolder = await drive.files.create({
        supportsAllDrives: config.targetIsSharedDrive,
        requestBody: {
          name: 'csv',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [config.targetDriveFolderId],
        },
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

/**
 * The main function of the convert command.
 * @param options The options passed to the convert command
 */
export default async function convert(
  options: ConvertCommandOptions,
): Promise<void> {
  if (!isAuthorized()) {
    // If the user is NOT logged in, exit the program with an error message
    throw new C2gError(MESSAGES.error.c2gErrorNotLoggedIn);
  }
  // If configFilePath is not specified in the options, use the CONFIG_FILE_NAME in the current working directory
  const configFilePath = options.configFilePath
    ? options.configFilePath
    : path.join(process.cwd(), CONFIG_FILE_NAME);
  // Read the configuration file and validate its contents
  const config = validateConfig(readConfigFileSync(configFilePath));

  // Show message on the console
  let convertingCsvWithFollowingSettings =
    MESSAGES.log.convertingCsvWithFollowingSettings(
      Object.keys(config)
        .map((key) => `${key}: ${config[key as keyof Config]}`)
        .join('\n'),
    );
  convertingCsvWithFollowingSettings = options.dryRun
    ? `${MESSAGES.log.runningOnDryRun}\n\n${convertingCsvWithFollowingSettings}`
    : convertingCsvWithFollowingSettings;
  console.info(convertingCsvWithFollowingSettings + '\n');

  // Authorize the user
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Get the file names of all Google Sheets files in the target Google Drive folder
  const existingSheetsFiles = await getExistingSheetsFiles(drive, config);

  // Get the full path of each CSV file in the source directory
  const csvFiles = getLocalCsvFilePaths(config.sourceDir);
  if (csvFiles.length === 0) {
    // If there are no CSV files, exit the program with a message
    throw new C2gError(MESSAGES.error.c2gErrorNoCsvFilesFound);
  }

  // Create an array of objects containing the file name, full path,
  // and Google Sheets file ID with the same file name (if it exists)
  // for the respective CSV files
  const csvFilesObjArray = csvFiles.map((csvFile): CsvFileObj => {
    const basename = path.basename(csvFile);
    const fileName = basename.replace(/\.(csv)$/i, '');
    return {
      name: fileName,
      basename: basename,
      path: csvFile,
      existingSheetsFileId: config.updateExistingGoogleSheets
        ? getExistingSheetsFileId(fileName, existingSheetsFiles)
        : null,
    };
  });

  // Get the Google Drive folder ID of the "csv" folder in the target Google Drive folder
  // If the "csv" folder does not exist, create it.
  const csvFolderId = await getCsvFolderId(drive, config);

  // If config.saveOriginalFilesToDrive is false, csvFolderId will be null
  if (csvFolderId) {
    console.info('\n' + MESSAGES.log.uploadingOriginalCsvFilesTo(csvFolderId));
  }

  for (const csvFileObj of csvFilesObjArray) {
    // Show the name of the CSV file being processed,
    // and whether it will update an existing Google Sheets file or create a new one
    console.info(
      MESSAGES.log.processingCsvFile(
        csvFileObj.basename,
        csvFileObj.existingSheetsFileId,
      ),
    );

    // The actual conversion of the CSV file into a Google Sheets file
    if (!options.dryRun) {
      // First, read the CSV file
      const csvData = fs.createReadStream(csvFileObj.path);

      // Depending on the value of config.updateExistingGoogleSheets,
      // either update an existing Google Sheets file or create a new one.
      // Create a new Google Sheets file anyway if csvFileObj.existingSheetsFileId is null.
      if (
        config.updateExistingGoogleSheets &&
        csvFileObj.existingSheetsFileId
      ) {
        // Update an existing Google Sheets file
        await drive.files.update({
          supportsAllDrives: config.targetIsSharedDrive,
          fileId: csvFileObj.existingSheetsFileId,
          media: {
            mimeType: 'text/csv',
            body: csvData,
          },
        });
      } else {
        // Create a new Google Sheets file
        await drive.files.create({
          supportsAllDrives: config.targetIsSharedDrive,
          requestBody: {
            name: csvFileObj.name,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [config.targetDriveFolderId],
          },
          media: {
            mimeType: 'text/csv',
            body: csvData,
          },
        });
      }

      if (config.saveOriginalFilesToDrive && csvFolderId) {
        // Upload the CSV file to the "csv" folder
        await drive.files.create({
          supportsAllDrives: config.targetIsSharedDrive,
          requestBody: {
            name: csvFileObj.basename,
            mimeType: 'text/csv',
            parents: [csvFolderId],
          },
          media: {
            mimeType: 'text/csv',
            body: fs.createReadStream(csvFileObj.path),
          },
        });
      }
    }

    // Show complete message for this file on the console
    console.info(MESSAGES.log.processingCsvFileComplete);
  }

  if (options.browse) {
    // Open the target Google Drive folder in the default browser if the --browse option is specified
    const url =
      config.targetDriveFolderId.toLowerCase() === 'root'
        ? 'https://drive.google.com/drive/my-drive'
        : `https://drive.google.com/drive/folders/${config.targetDriveFolderId}`;
    console.info('\n' + MESSAGES.log.openingTargetDriveFolderOnBrowser(url));
    await open(url);
  }
}
