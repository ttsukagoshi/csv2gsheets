export declare const CREDENTIALS_FILE_NAME = "c2g.creds.json";
export declare const TOKEN_FILE_NAME = ".c2grc.json";
export declare const CONFIG_FILE_NAME = "c2g.config.json";
export declare const HOME_DIR: string;
export interface Config {
    sourceDir: string;
    targetDriveFolderId: string;
    targetIsSharedDrive: boolean;
    updateExistingGoogleSheets: boolean;
    saveOriginalFilesToDrive: boolean;
}
export declare const DEFAULT_CONFIG: Config;
