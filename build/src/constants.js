// Constants
import { homedir } from 'os';
// File Names
export const CREDENTIALS_FILE_NAME = 'c2g.creds.json';
export const TOKEN_FILE_NAME = '.c2grc.json';
export const CONFIG_FILE_NAME = 'c2g.config.json';
// Home Directory
export const HOME_DIR = homedir();
// Default Config
export const DEFAULT_CONFIG = {
    sourceDir: HOME_DIR,
    targetDriveFolderId: 'root',
    targetIsSharedDrive: false,
    updateExistingGoogleSheets: false,
    saveOriginalFilesToDrive: false,
};
//# sourceMappingURL=constants.js.map