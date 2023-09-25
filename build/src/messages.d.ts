export declare const MESSAGES: {
    error: {
        typeErrorSourceDirMustBeString: string;
        typeErrorTargetDriveFolderIdMustBeString: string;
        typeErrorTargetIsSharedDriveMustBeBoolean: string;
        typeErrorUpdateExistingGoogleSheetsMustBeBoolean: string;
        typeErrorSaveOriginalFilesToDriveMustBeBoolean: string;
        c2gErrorConfigFileNotFound: string;
        c2gErrorCredentialsFileNotFound: string;
        c2gErrorInvalidCredentials: string;
        c2gErrorFailedToCreateCsvFolder: string;
        c2gErrorNoCsvFilesFound: string;
        c2gErrorNotLoggedIn: string;
        c2gErrorSourceDirMustBeValidPath: string;
    };
    log: {
        convertingCsvWithFollowingSettings: (configStr: string) => string;
        loggingIn: string;
        noChangesWereMade: string;
        openingTargetDriveFolderOnBrowser: (url: string) => string;
        processingCsvFile: (fileName: string, existingSheetsFileId: string | null) => string;
        processingCsvFileComplete: string;
        runningOnDryRun: string;
        uploadingOriginalCsvFilesTo: (driveFolderId: string) => string;
        youHaveBeenLoggedOut: string;
        youAreLoggedInAs: (email: string) => string;
        youAreNotLoggedIn: string;
    };
    prompt: {
        enterSourceDir: string;
        enterTargetDriveFolderId: string;
        enterValidId: string;
        enterValidPath: string;
        overwriteExistingConfigFileYN: string;
        saveOriginalFilesToDriveYN: string;
        targetIsSharedDriveYN: string;
        updateExistingGoogleSheetsYN: string;
    };
};
