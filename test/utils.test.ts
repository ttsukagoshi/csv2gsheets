// Jest test for functions in ./src/utils.ts

import fs from 'fs';
import path from 'path';
import { drive_v3 } from 'googleapis';

import { Config, DEFAULT_CONFIG, HOME_DIR } from '../src/constants';
import * as utils from '../src/utils';
import { C2gError } from '../src/c2g-error';

jest.mock('fs');
jest.mock('googleapis');

describe('readConfigFileSync', () => {
  const configFilePath = '/path/to/config.json';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the contents of the config file as an object', () => {
    const config = {
      sourceDir: '/path/to/source',
      targetDriveFolderId: '12345',
      targetIsSharedDrive: true,
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
    expect(utils.readConfigFileSync(configFilePath)).toEqual(config);
  });

  it('should throw an error if the config file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => utils.readConfigFileSync(configFilePath)).toThrow(C2gError);
  });

  it('should throw an error if the config file is not valid JSON', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('not valid JSON');
    expect(() => utils.readConfigFileSync(configFilePath)).toThrow();
  });
});

describe('validateConfig', () => {
  it('should return the config object if it is valid', () => {
    const config = {
      sourceDir: HOME_DIR,
      targetDriveFolderId: '12345',
      targetIsSharedDrive: true,
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    } as Partial<Config>;
    expect(utils.validateConfig(config)).toEqual(config);
  });

  it('should throw an error if sourceDir is not a string', () => {
    const config = { sourceDir: 123 } as unknown as Partial<Config>;
    expect(() => utils.validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if sourceDir is not a valid path', () => {
    const config = {
      sourceDir: '/path/to/nonexistent/directory',
    } as Partial<Config>;
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => utils.validateConfig(config)).toThrow(C2gError);
  });

  it('should throw an error if targetDriveFolderId is not a string', () => {
    const config = { targetDriveFolderId: 123 } as unknown as Partial<Config>;
    expect(() => utils.validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if targetIsSharedDrive is not a boolean', () => {
    const config = {
      targetIsSharedDrive: 'true',
    } as unknown as Partial<Config>;
    expect(() => utils.validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if updateExistingGoogleSheets is not a boolean', () => {
    const config = {
      updateExistingGoogleSheets: 'true',
    } as unknown as Partial<Config>;
    expect(() => utils.validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if saveOriginalFilesToDrive is not a boolean', () => {
    const config = {
      saveOriginalFilesToDrive: 'false',
    } as unknown as Partial<Config>;
    expect(() => utils.validateConfig(config)).toThrow(TypeError);
  });

  it('should add default values for missing config properties', () => {
    const config = {} as Partial<Config>;
    expect(utils.validateConfig(config)).toEqual(DEFAULT_CONFIG);
  });
});

describe('isRoot', () => {
  it('should return true if targetDriveFolderId is "root" (case-insensitive)', () => {
    expect(utils.isRoot('root')).toBe(true);
    expect(utils.isRoot('ROOT')).toBe(true);
    expect(utils.isRoot('Root')).toBe(true);
  });
  it('should return false if targetDriveFolderId is not "root" or "ROOT"', () => {
    expect(utils.isRoot('12345')).toBe(false);
  });
});

describe('getLocalCsvFilePaths', () => {
  const testDir = path.join(process.cwd(), 'testDir');

  it('should return an array with the full path of a single CSV file', () => {
    const mockSingleCsvFilePath = path.join(testDir, 'file1.csv');
    const csvFiles = utils.getLocalCsvFilePaths(mockSingleCsvFilePath);
    expect(csvFiles).toEqual([mockSingleCsvFilePath]);
  });

  it('should return an array with the full path of all CSV files in a directory', () => {
    const mockTestFiles = ['file1.csv', 'file2.CSV', 'file3.txt'];
    const mockCsvFiles = ['file1.csv', 'file2.CSV'];
    const mockCsvFilePaths = mockCsvFiles.map((file) =>
      path.join(testDir, file),
    );
    jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(mockTestFiles as unknown as fs.Dirent[]);
    const csvFiles = utils.getLocalCsvFilePaths(testDir);
    expect(csvFiles).toEqual(mockCsvFilePaths);
  });

  it('should return an empty array if there are no CSV files in a directory', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
    const csvFiles = utils.getLocalCsvFilePaths(testDir);
    expect(csvFiles).toEqual([]);
  });
});

describe('getExistingSheetsFiles', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseConfig: Config = {
    sourceDir: '/path/to/source',
    targetDriveFolderId: '12345',
    targetIsSharedDrive: true,
    updateExistingGoogleSheets: true,
    saveOriginalFilesToDrive: false,
  };

  it('should return an array of existing Google Sheets files without nextPageToken', async () => {
    const mockDrive = {
      files: {
        list: jest.fn().mockImplementation(() => {
          return {
            data: {
              files: [
                {
                  id: '12345',
                  name: 'file1',
                } as drive_v3.Schema$File,
                {
                  id: '67890',
                  name: 'file2',
                } as drive_v3.Schema$File,
              ],
            } as drive_v3.Schema$FileList,
          };
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = baseConfig;
    expect(await utils.getExistingSheetsFiles(mockDrive, mockConfig)).toEqual([
      {
        id: '12345',
        name: 'file1',
      },
      {
        id: '67890',
        name: 'file2',
      },
    ]);
  });

  it('should return an array of existing Google Sheets files with recursive calls using nextPageToken', async () => {
    const mockDrive = {
      files: {
        list: jest
          .fn()
          .mockImplementationOnce(() => {
            return {
              data: {
                files: [
                  {
                    id: '12345',
                    name: 'file1',
                  } as drive_v3.Schema$File,
                  {
                    id: '67890',
                    name: 'file2',
                  } as drive_v3.Schema$File,
                ] as drive_v3.Schema$FileList,
                nextPageToken: 'nextPageToken123',
              },
            };
          })
          .mockImplementationOnce(() => {
            return {
              data: {
                files: [
                  {
                    id: 'abcde',
                    name: 'file3',
                  } as drive_v3.Schema$File,
                ] as drive_v3.Schema$FileList,
              },
            };
          }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = baseConfig;
    expect(await utils.getExistingSheetsFiles(mockDrive, mockConfig)).toEqual([
      {
        id: '12345',
        name: 'file1',
      },
      {
        id: '67890',
        name: 'file2',
      },
      {
        id: 'abcde',
        name: 'file3',
      },
    ]);
  });

  it('should return the original fileList if config.updateExistingGoogleSheets is false', async () => {
    const mockDrive = {} as unknown as drive_v3.Drive;
    const mockConfig = {
      ...baseConfig,
      updateExistingGoogleSheets: false,
    };
    const mockFileList = [
      {
        id: '12345',
        name: 'file1',
      },
      {
        name: 'file2',
      },
    ] as unknown as drive_v3.Schema$File[];
    expect(
      await utils.getExistingSheetsFiles(mockDrive, mockConfig, mockFileList),
    ).toEqual(mockFileList);
  });
});

describe('getExistingSheetsFileId', () => {
  const mockExistingSheetsFiles = [
    {
      id: '12345',
      name: 'file1',
    },
    {
      name: 'file2',
    },
  ] as unknown as drive_v3.Schema$File[];
  const mockEmptyExistingSheetsFiles = [] as unknown as drive_v3.Schema$File[];

  it('should return the file ID if the file exists', () => {
    expect(
      utils.getExistingSheetsFileId('file1', mockExistingSheetsFiles),
    ).toBe('12345');
  });

  it('should return null if the existing file does not have a valid ID', () => {
    expect(
      utils.getExistingSheetsFileId('file2', mockExistingSheetsFiles),
    ).toBeNull();
  });

  it('should return null if the file does not exist', () => {
    expect(
      utils.getExistingSheetsFileId('file99', mockExistingSheetsFiles),
    ).toBeNull();
  });

  it('should return null if the array existingSheetsFiles has the length of 0', () => {
    expect(
      utils.getExistingSheetsFileId('file1', mockEmptyExistingSheetsFiles),
    ).toBeNull();
  });
});

describe('getCsvFolderId', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseConfig: Config = {
    sourceDir: '/path/to/source',
    targetDriveFolderId: 'TargetDriveFolderId12345',
    targetIsSharedDrive: true,
    updateExistingGoogleSheets: true,
    saveOriginalFilesToDrive: true,
  };

  it('should return the ID of the csv folder if config.saveOriginalFilesToDrive is false and it exists', async () => {
    const mockDrive = {
      files: {
        list: jest.fn().mockImplementation(() => {
          return {
            data: {
              files: [
                {
                  id: 'CsvFolderId12345',
                  name: 'csv',
                } as drive_v3.Schema$File,
                {
                  id: 'OtherFolderId67890',
                  name: 'csv',
                } as drive_v3.Schema$File,
              ] as drive_v3.Schema$FileList,
            },
          };
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = baseConfig;
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe(
      'CsvFolderId12345',
    );
  });

  it('should create a new folder in the target Google Drive folder and return its ID', async () => {
    const mockDrive = {
      files: {
        list: jest
          .fn()
          .mockImplementationOnce(() => {
            return {
              data: {
                files: [] as drive_v3.Schema$FileList,
              },
            };
          })
          .mockImplementationOnce(() => {
            return {};
          })
          .mockImplementationOnce(() => {
            return {
              data: {
                files: [
                  {
                    noid: 'no-id',
                    name: 'csv',
                  } as drive_v3.Schema$File,
                ] as drive_v3.Schema$FileList,
              },
            };
          }),
        create: jest.fn().mockImplementation(() => {
          return {
            data: {
              id: 'NewlyCreatedCsvFolderId12345',
            },
          };
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = baseConfig;
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe(
      'NewlyCreatedCsvFolderId12345',
    );
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe(
      'NewlyCreatedCsvFolderId12345',
    );
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe(
      'NewlyCreatedCsvFolderId12345',
    );
  });

  it('should create a new folder at the root of My Drive and return its ID', async () => {
    const mockDrive = {
      files: {
        list: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              files: [] as drive_v3.Schema$FileList,
            },
          });
        }),
        create: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              id: 'NewlyCreatedCsvFolderId12345',
            },
          });
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = {
      ...baseConfig,
      targetDriveFolderId: 'root',
    };
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe(
      'NewlyCreatedCsvFolderId12345',
    );
    expect(mockDrive.files.create).toHaveBeenCalledWith({
      supportsAllDrives: mockConfig.targetIsSharedDrive,
      requestBody: {
        name: 'csv',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mockConfig.targetDriveFolderId],
      },
    });
  });

  it('should throw an error if the csv folder could not be created', async () => {
    const mockDrive = {
      files: {
        list: jest.fn().mockImplementation(() => {
          return {
            data: {
              files: [] as drive_v3.Schema$FileList,
            },
          };
        }),
        create: jest.fn().mockImplementation(() => {
          return {
            data: {},
          };
        }),
      } as unknown as drive_v3.Resource$Files,
    } as unknown as drive_v3.Drive;
    const mockConfig = baseConfig;
    await expect(utils.getCsvFolderId(mockDrive, mockConfig)).rejects.toThrow(
      C2gError,
    );
  });

  it('should return null if config.saveOriginalFilesToDrive is false', async () => {
    const mockDrive = {} as unknown as drive_v3.Drive;
    const mockConfig = {
      ...baseConfig,
      saveOriginalFilesToDrive: false,
    };
    expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBeNull();
  });
});
