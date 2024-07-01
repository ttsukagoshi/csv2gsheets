// Constants

import { homedir } from 'os';

// File Names
export const CREDENTIALS_FILE_NAME = 'c2g.creds.json';
export const TOKEN_FILE_NAME = '.c2grc.json';
export const CONFIG_FILE_NAME = 'c2g.config.json';

// Home Directory
export const HOME_DIR = homedir();

// Interface
export interface Config {
  sourceDir: string;
  targetDriveFolderId: string;
  targetIsSharedDrive: boolean;
  updateExistingGoogleSheets: boolean;
  saveOriginalFilesToDrive: boolean;
}
export interface ConfigKeys {
  sourceDir: string;
  targetDriveFolderId: string;
  targetIsSharedDrive: string;
  updateExistingGoogleSheets: string;
  saveOriginalFilesToDrive: string;
}

// Default Config
export const DEFAULT_CONFIG: Config = {
  sourceDir: process.cwd(),
  targetDriveFolderId: 'root',
  targetIsSharedDrive: false,
  updateExistingGoogleSheets: false,
  saveOriginalFilesToDrive: false,
};

// Human-readable meaning of the Config keys
export const CONFIG_KEYS: ConfigKeys = {
  sourceDir: 'Source directory of the CSV files',
  targetDriveFolderId: 'Target Google Drive Folder ID',
  targetIsSharedDrive: 'Target is in a Shared Drive',
  updateExistingGoogleSheets:
    'Update existing Google Sheets files with the same name',
  saveOriginalFilesToDrive:
    'Save original CSV files to the Drive folder as well',
};
