// convert command

import fs from 'fs';
import { google, drive_v3 } from 'googleapis';
import open from 'open';
import path from 'path';

import { authorize, isAuthorized } from '../auth';
import { C2gError } from '../c2g-error';
import { Config, CONFIG_FILE_NAME } from '../constants';
import { MESSAGES } from '../messages';
import * as utils from '../utils';

export interface ConvertCommandOptions {
  readonly browse?: boolean;
  readonly configFilePath?: string;
  readonly dryRun?: boolean;
}

export interface CsvFileObj {
  name: string;
  basename: string;
  path: string;
  existingSheetsFileId: string | null;
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
  const config = utils.validateConfig(utils.readConfigFileSync(configFilePath));

  // Show message on the console
  let convertingCsvWithFollowingSettings =
    MESSAGES.log.convertingCsvWithFollowingSettings(
      Object.keys(config)
        .map((key) => `${key}: ${config[key as keyof Config]}`)
        .join('\n  '),
    );
  convertingCsvWithFollowingSettings = options.dryRun
    ? `${MESSAGES.log.runningOnDryRun}\n\n${convertingCsvWithFollowingSettings}`
    : convertingCsvWithFollowingSettings;
  console.info(convertingCsvWithFollowingSettings);

  // Get the full paths of the local CSV files in the source directory
  const csvFiles = utils.getLocalCsvFilePaths(config.sourceDir);
  if (csvFiles.length === 0) {
    // If there are no CSV files, exit the program with a message
    throw new C2gError(MESSAGES.error.c2gErrorNoCsvFilesFound);
  }

  // Authorize the user
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Get the file names of all Google Sheets files in the target Google Drive folder
  const existingSheetsFiles = await utils.getExistingSheetsFiles(drive, config);

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
        ? utils.getExistingSheetsFileId(fileName, existingSheetsFiles)
        : null,
    };
  });

  // Get the Google Drive folder ID of the "csv" folder in the target Google Drive folder
  // If the "csv" folder does not exist, create it.
  // If config.saveOriginalFilesToDrive is false, csvFolderId will be null
  const csvFolderId = await utils.getCsvFolderId(drive, config);

  if (csvFolderId) {
    console.info(MESSAGES.log.uploadingOriginalCsvFilesTo(csvFolderId));
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
        const requestBody: drive_v3.Schema$File = {
          name: csvFileObj.name,
          mimeType: 'application/vnd.google-apps.spreadsheet',
        };
        if (utils.isRoot(config.targetDriveFolderId)) {
          requestBody.parents = [config.targetDriveFolderId];
        }
        await drive.files.create({
          supportsAllDrives: config.targetIsSharedDrive,
          requestBody: requestBody,
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
    const url = utils.isRoot(config.targetDriveFolderId)
      ? 'https://drive.google.com/drive/my-drive'
      : `https://drive.google.com/drive/folders/${config.targetDriveFolderId}`;
    console.info(MESSAGES.log.openingTargetDriveFolderOnBrowser(url));
    await open(url);
  }
}
