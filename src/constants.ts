// File Names
export const CREDENTIALS_FILE_NAME = 'x2s.creds.json';
export const TOKEN_FILE_NAME = '.x2src.json';
export const CONFIG_FILE_NAME = 'x2s.config.json';

// Home Directory
export const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '';

// Types
export type Config = {
  sourceDir: string;
  targetDriveFolderId: string;
  updateExistingGoogleSheets: boolean;
  saveOriginalFilesToDrive: boolean;
};
