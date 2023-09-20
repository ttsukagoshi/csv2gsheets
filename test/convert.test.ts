// Jest test for the convert command in ./src/commands/convert.ts

import fs from 'fs';
import open from 'open';
import path from 'path';
import { ChildProcess } from 'child_process';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import * as auth from '../src/auth';
import { C2gError } from '../src/c2g-error';
import convert from '../src/commands/convert';
import { Config } from '../src/constants';
import { MESSAGES } from '../src/messages';
import * as utils from '../src/utils';

jest.mock('fs');
jest.mock('googleapis');
jest.mock('open');

describe('convert', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockConfig: Config = {
    sourceDir: path.join(process.cwd(), 'testCsvDir'),
    targetDriveFolderId: 'TargetDriveFolderId12345',
    targetIsSharedDrive: true,
    updateExistingGoogleSheets: false,
    saveOriginalFilesToDrive: false,
  };

  it('should throw an error if the user is not logged in', async () => {
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => false);
    await expect(convert({})).rejects.toThrow(
      new C2gError(MESSAGES.error.c2gErrorNotLoggedIn),
    );
  });

  it('should throw an error if there are no CSV files in the designated local directory', async () => {
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfig);
    jest.spyOn(utils, 'validateConfig').mockImplementation(() => mockConfig);
    jest.spyOn(utils, 'getLocalCsvFilePaths').mockImplementation(() => []);
    await expect(convert({})).rejects.toThrow(
      new C2gError(MESSAGES.error.c2gErrorNoCsvFilesFound),
    );
  });

  it('should show the complete conversion process on dry run', async () => {
    // Arrange
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfig.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfig);
    jest.spyOn(utils, 'validateConfig').mockImplementation(() => mockConfig);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    jest.spyOn(google, 'drive').mockImplementation(() => {
      return {} as unknown as drive_v3.Drive;
    });
    // Act
    await convert({ dryRun: true });
    // Assert
    expect(console.info).toHaveBeenNthCalledWith(
      1,
      `${
        MESSAGES.log.runningOnDryRun
      }\n\n${MESSAGES.log.convertingCsvWithFollowingSettings(
        Object.keys(mockConfig)
          .map((key) => `${key}: ${mockConfig[key as keyof Config]}`)
          .join('\n  '),
      )}`,
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      MESSAGES.log.processingCsvFile(mockLocalCsvFiles[0], null),
    );
    expect(console.info).toHaveBeenNthCalledWith(
      3,
      MESSAGES.log.processingCsvFileComplete,
    );
    expect(console.info).toHaveBeenNthCalledWith(
      4,
      MESSAGES.log.processingCsvFile(mockLocalCsvFiles[1], null),
    );
    expect(console.info).toHaveBeenNthCalledWith(
      5,
      MESSAGES.log.processingCsvFileComplete,
    );
  });

  it('should open the default web browser if --browse option is enabled', async () => {
    // Arrange
    const mockOpen = open as jest.MockedFunction<typeof open>;
    mockOpen.mockImplementation(() => {
      return Promise.resolve({ pid: 12345 } as unknown as ChildProcess);
    });
    // Other arranged settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfig.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfig);
    jest.spyOn(utils, 'validateConfig').mockImplementation(() => mockConfig);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    jest.spyOn(google, 'drive').mockImplementation(() => {
      return {} as unknown as drive_v3.Drive;
    });
    // Act
    await convert({ dryRun: true, browse: true });
    // Assert
    expect(mockOpen).toHaveBeenCalledWith(
      `https://drive.google.com/drive/folders/${mockConfig.targetDriveFolderId}`,
    );
    expect(console.info).toHaveBeenNthCalledWith(
      6,
      MESSAGES.log.openingTargetDriveFolderOnBrowser(
        `https://drive.google.com/drive/folders/${mockConfig.targetDriveFolderId}`,
      ),
    );
  });

  it('should complete the conversion process on dry run with configFilePath', async () => {
    // Arrange
    const mockConfigFilePath = 'path/to/c2g.config.json';
    // Other settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfig.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfig);
    jest.spyOn(utils, 'validateConfig').mockImplementation(() => mockConfig);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    jest.spyOn(google, 'drive').mockImplementation(() => {
      return {} as unknown as drive_v3.Drive;
    });
    // Act: Add configFilePath as an option
    await convert({
      dryRun: true,
      configFilePath: mockConfigFilePath,
    });
    // Assert
    expect(utils.readConfigFileSync).toHaveBeenCalledWith(mockConfigFilePath);
  });

  it('should complete the conversion process on dry run with updateExistingGoogleSheets being true', async () => {
    // Arrange
    const mockConfigWithUpdateExistingGoogleSheets: Config = {
      ...mockConfig,
      updateExistingGoogleSheets: true,
    };
    jest.spyOn(utils, 'getExistingSheetsFiles').mockImplementation(() => {
      return Promise.resolve([]);
    });
    jest.spyOn(utils, 'getExistingSheetsFileId').mockImplementation(() => null);
    // Other settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    // except for mockConfig being replaced with mockConfigWithUpdateExistingGoogleSheets
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfigWithUpdateExistingGoogleSheets.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfigWithUpdateExistingGoogleSheets);
    jest
      .spyOn(utils, 'validateConfig')
      .mockImplementation(() => mockConfigWithUpdateExistingGoogleSheets);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    // Act: Add configFilePath as an option
    await convert({ dryRun: true });
    // Assert
    expect(utils.getExistingSheetsFileId).toHaveBeenCalled();
  });

  it('should complete the conversion process with updateExistingGoogleSheets=true', async () => {
    // Arrange
    const mockConfigWithUpdateExistingGoogleSheets: Config = {
      ...mockConfig,
      updateExistingGoogleSheets: true,
    };
    const mockExistingSheetsFileId = 'file1Id12345';
    jest.spyOn(utils, 'getExistingSheetsFiles').mockImplementation(() => {
      return Promise.resolve([]);
    });
    jest
      .spyOn(utils, 'getExistingSheetsFileId')
      .mockImplementationOnce(() => mockExistingSheetsFileId)
      .mockImplementationOnce(() => null);
    const mockReadStream = {} as fs.ReadStream;
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadStream);
    const mockDrive = {
      files: {
        update: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // update existing Google Sheets file
        }),
        create: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // create new Google Sheets file
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    jest.spyOn(google, 'drive').mockImplementation(() => mockDrive);
    // Other settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    // except for mockConfig being replaced with mockConfigWithUpdateExistingGoogleSheets
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfigWithUpdateExistingGoogleSheets.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfigWithUpdateExistingGoogleSheets);
    jest
      .spyOn(utils, 'validateConfig')
      .mockImplementation(() => mockConfigWithUpdateExistingGoogleSheets);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    // Act
    await convert({});
    // Assert
    expect(mockDrive.files.update).toHaveBeenCalledTimes(1);
    expect(mockDrive.files.update).toHaveBeenCalledWith({
      supportsAllDrives:
        mockConfigWithUpdateExistingGoogleSheets.targetIsSharedDrive,
      fileId: mockExistingSheetsFileId,
      media: {
        mimeType: 'text/csv',
        body: mockReadStream,
      },
    });
    expect(mockDrive.files.create).toHaveBeenCalledTimes(1);
    expect(mockDrive.files.create).toHaveBeenCalledWith({
      supportsAllDrives:
        mockConfigWithUpdateExistingGoogleSheets.targetIsSharedDrive,
      requestBody: {
        name: 'file2',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [mockConfigWithUpdateExistingGoogleSheets.targetDriveFolderId],
      },
      media: {
        mimeType: 'text/csv',
        body: mockReadStream,
      },
    });
  });

  it('should complete the conversion process with updateExistingGoogleSheets=true, targetDriveFolderId=root, --browse=true', async () => {
    // Arrange
    const mockConfigWithTargetRoot: Config = {
      ...mockConfig,
      updateExistingGoogleSheets: true,
      targetDriveFolderId: 'root',
    };
    const mockExistingSheetsFileId = 'file1Id12345';
    jest.spyOn(utils, 'getExistingSheetsFiles').mockImplementation(() => {
      return Promise.resolve([]);
    });
    jest
      .spyOn(utils, 'getExistingSheetsFileId')
      .mockImplementationOnce(() => mockExistingSheetsFileId)
      .mockImplementationOnce(() => null);
    const mockReadStream = {} as fs.ReadStream;
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadStream);
    const mockDrive = {
      files: {
        update: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // update existing Google Sheets file
        }),
        create: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // create new Google Sheets file
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    jest.spyOn(google, 'drive').mockImplementation(() => mockDrive);
    // Other settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    // except for mockConfig being replaced with mockConfigWithUpdateExistingGoogleSheets
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfigWithTargetRoot.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfigWithTargetRoot);
    jest
      .spyOn(utils, 'validateConfig')
      .mockImplementation(() => mockConfigWithTargetRoot);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    const mockOpen = open as jest.MockedFunction<typeof open>;
    mockOpen.mockImplementation(() => {
      return Promise.resolve({ pid: 12345 } as unknown as ChildProcess);
    });
    // Act
    await convert({ browse: true });
    // Assert
    expect(mockOpen).toHaveBeenCalledWith(
      'https://drive.google.com/drive/my-drive',
    );
    expect(console.info).toHaveBeenNthCalledWith(
      4,
      MESSAGES.log.processingCsvFile(mockLocalCsvFiles[1], null),
    );
    expect(console.info).toHaveBeenNthCalledWith(
      6,
      MESSAGES.log.openingTargetDriveFolderOnBrowser(
        'https://drive.google.com/drive/my-drive',
      ),
    );
  });

  it('should complete the conversion process with saveOriginalFilesToDrive=true', async () => {
    // Arrange
    const mockConfigWithSaveOriginalFilesToDrive: Config = {
      ...mockConfig,
      saveOriginalFilesToDrive: true,
    };
    const mockCsvFolderId = 'CsvFolderId12345';
    jest.spyOn(utils, 'getExistingSheetsFiles').mockImplementation(() => {
      return Promise.resolve([]);
    });
    jest.spyOn(utils, 'getExistingSheetsFileId').mockImplementation(() => null);
    jest.spyOn(utils, 'getCsvFolderId').mockImplementation(() => {
      return Promise.resolve(mockCsvFolderId);
    });
    const mockReadStream = {} as fs.ReadStream;
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadStream);
    const mockDrive = {
      files: {
        update: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // update existing Google Sheets file
        }),
        create: jest.fn().mockImplementation(() => {
          return Promise.resolve({}); // create new Google Sheets file
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    jest.spyOn(google, 'drive').mockImplementation(() => mockDrive);
    // Other settings are the same as the previous test:
    // 'should show the complete conversion process on dry run'
    // except for mockConfig being replaced with mockConfigWithUpdateExistingGoogleSheets
    const mockLocalCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockLocalCsvFilePaths = mockLocalCsvFiles.map((file) =>
      path.join(mockConfigWithSaveOriginalFilesToDrive.sourceDir, file),
    );
    jest.spyOn(auth, 'isAuthorized').mockImplementation(() => true);
    jest.spyOn(console, 'info').mockImplementation();
    jest
      .spyOn(utils, 'readConfigFileSync')
      .mockImplementation(() => mockConfigWithSaveOriginalFilesToDrive);
    jest
      .spyOn(utils, 'validateConfig')
      .mockImplementation(() => mockConfigWithSaveOriginalFilesToDrive);
    jest
      .spyOn(utils, 'getLocalCsvFilePaths')
      .mockImplementation(() => mockLocalCsvFilePaths);

    jest.spyOn(auth, 'authorize').mockImplementation(() => {
      return Promise.resolve({} as unknown as OAuth2Client);
    });
    // Act
    await convert({});
    // Assert
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      MESSAGES.log.uploadingOriginalCsvFilesTo(mockCsvFolderId),
    );
    expect(mockDrive.files.create).toHaveBeenCalledTimes(4);
  });
});
