import { drive_v3 } from 'googleapis';
import { Config } from './constants';
/**
 * Check if the given source directory is valid.
 * @param sourceDir The source directory to validate
 * @returns `true` if the source directory is valid, or a string containing the error message if it isn't
 */
export declare function validateSourceDir(sourceDir: string): boolean | string;
/**
 * Check if the given target Google Drive folder ID is a string of length > 0.
 * @param id The target Google Drive folder ID to validate
 * @returns `true` if the target Google Drive folder ID is valid, or a string containing the error message if it isn't
 */
export declare function validateTargetDriveFolderId(id: string): boolean | string;
/**
 * Creates a config file in the current directory based on user input
 */
export declare function createConfigFile(): Promise<void>;
/**
 * Read the configuration file and return its contents as an object.
 * @param configFilePath The path to the configuration file
 * @returns The contents of the configuration file as an object
 */
export declare function readConfigFileSync(configFilePath: string): Config;
/**
 * Validate the configuration file.
 * Note that this function does not check if the target Google Drive folder exists
 * or if the user has access to that folder.
 * @param configObj The contents of the configuration file as an object
 */
export declare function validateConfig(configObj: Partial<Config>): Config;
/**
 * Check if the given target Google Drive folder ID is "root" (case-insensitive).
 * If it is, return true. Here, "root" is a special value that refers to the root folder
 * in My Drive.
 * @param targetDriveFolderId The target Google Drive folder ID
 * @returns `true` if the target Google Drive folder ID is "root", or `false` if it isn't
 */
export declare function isRoot(targetDriveFolderId: string): boolean;
/**
 * Get the file names of all Google Sheets files in the target Google Drive folder.
 * Iterate through all pages of the results if nextPageToken is present.
 * If `config.updateExistingGoogleSheets` in the given `config` is `false`, return an empty array.
 * @param config The configuration object defined in `c2g.config.json`
 * @returns An array of objects containing the file ID and name of each Google Sheets file in the target Google Drive folder
 */
export declare function getExistingSheetsFiles(drive: drive_v3.Drive, config: Config, fileList?: drive_v3.Schema$File[], nextPageToken?: string): Promise<drive_v3.Schema$File[]>;
/**
 * Get the full path of each CSV file in the given directory and return them as an array.
 * @param sourceDir The path to the source directory to look for CSV files
 * @returns An array of full paths of CSV files in the source directory
 */
export declare function getLocalCsvFilePaths(sourceDir: string): string[];
/**
 * Check if the given CSV file name exists in the given Google Drive folder
 * and return the Google Sheets file ID if it does.
 * If it doesn't, return null.
 * @param csvFileName The name of the CSV file
 * @param existingSheetsFilesObj The object containing the file names of all Google Sheets files in the target Google Drive folder
 * @returns The Google Sheets file ID if the CSV file name exists in the target Google Drive folder, or null if it doesn't
 */
export declare function getExistingSheetsFileId(csvFileName: string, existingSheetsFiles: drive_v3.Schema$File[]): string | null;
/**
 * Get the Google Drive folder ID of the "csv" folder in the target Google Drive folder.
 * If a folder named "csv" does not exist, create it.
 * If `config.saveOriginalFilesToDrive` in the given `config` is `false`, return `null`.
 * @param drive The Google Drive API v3 instance created by `google.drive({ version: 'v3', auth })`
 * @param config The configuration object defined in `c2g.config.json`
 * @returns The Google Drive folder ID of the "csv" folder in the target Google Drive folder,
 * or `null` if the given `config.saveOriginalFilesToDrive` is `false`
 */
export declare function getCsvFolderId(drive: drive_v3.Drive, config: Config): Promise<string | null>;
