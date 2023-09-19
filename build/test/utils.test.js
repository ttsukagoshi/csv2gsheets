// Jest test for functions in ./src/utils.ts
import fs from 'fs';
import path from 'path';
import { C2gError } from '../src/c2g-error';
import * as constants from '../src/constants';
import inquirer from 'inquirer';
import { MESSAGES } from '../src/messages';
import * as utils from '../src/utils';
jest.mock('fs');
jest.mock('googleapis');
jest.mock('inquirer');
describe('createConfigFile', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should create a config file with the default values', async () => {
        // Arrange
        const mockConfig = {
            sourceDir: constants.DEFAULT_CONFIG.sourceDir,
            targetDriveFolderId: constants.DEFAULT_CONFIG.targetDriveFolderId,
            targetIsSharedDrive: constants.DEFAULT_CONFIG.targetDriveFolderId,
            updateExistingGoogleSheets: constants.DEFAULT_CONFIG.updateExistingGoogleSheets,
            saveOriginalFilesToDrive: constants.DEFAULT_CONFIG.saveOriginalFilesToDrive,
        };
        jest.spyOn(inquirer, 'prompt').mockResolvedValue(mockConfig);
        // Act
        await utils.createConfigFile();
        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(process.cwd(), constants.CONFIG_FILE_NAME), JSON.stringify(mockConfig, null, 2));
    });
    describe('validation functions for inquirer: validateSourceDir, validateTargetDriveFolderId', () => {
        it('should return true if sourceDir is a valid path', () => {
            // Arrange
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            // Act & Assert
            expect(utils.validateSourceDir('/some/path/')).toBe(true);
        });
        it('should return a predefined message if sourceDir is not a valid path', () => {
            // Arrange
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            // Act & Assert
            expect(utils.validateSourceDir('/some/path/')).toBe(MESSAGES.prompt.enterValidPath);
        });
        it('should return true if targetDriveFolderId is a string of length > 0', () => {
            // Arrange
            const targetDriveFolderId = '12345';
            // Act & Assert
            expect(utils.validateTargetDriveFolderId(targetDriveFolderId)).toBe(true);
        });
        it('should return a predefined message if targetDriveFolderId is a string of 0 length', () => {
            // Arrange
            const targetDriveFolderId = '';
            // Act & Assert
            expect(utils.validateTargetDriveFolderId(targetDriveFolderId)).toBe(MESSAGES.prompt.enterValidId);
        });
    });
});
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
            sourceDir: constants.HOME_DIR,
            targetDriveFolderId: '12345',
            targetIsSharedDrive: true,
            updateExistingGoogleSheets: true,
            saveOriginalFilesToDrive: false,
        };
        expect(utils.validateConfig(config)).toEqual(config);
    });
    it('should throw an error if sourceDir is not a string', () => {
        const config = { sourceDir: 123 };
        expect(() => utils.validateConfig(config)).toThrow(TypeError);
    });
    it('should throw an error if sourceDir is not a valid path', () => {
        const config = {
            sourceDir: '/path/to/nonexistent/directory',
        };
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        expect(() => utils.validateConfig(config)).toThrow(C2gError);
    });
    it('should throw an error if targetDriveFolderId is not a string', () => {
        const config = {
            targetDriveFolderId: 123,
        };
        expect(() => utils.validateConfig(config)).toThrow(TypeError);
    });
    it('should throw an error if targetIsSharedDrive is not a boolean', () => {
        const config = {
            targetIsSharedDrive: 'true',
        };
        expect(() => utils.validateConfig(config)).toThrow(TypeError);
    });
    it('should throw an error if updateExistingGoogleSheets is not a boolean', () => {
        const config = {
            updateExistingGoogleSheets: 'true',
        };
        expect(() => utils.validateConfig(config)).toThrow(TypeError);
    });
    it('should throw an error if saveOriginalFilesToDrive is not a boolean', () => {
        const config = {
            saveOriginalFilesToDrive: 'false',
        };
        expect(() => utils.validateConfig(config)).toThrow(TypeError);
    });
    it('should add default values for missing config properties', () => {
        const config = {};
        expect(utils.validateConfig(config)).toEqual(constants.DEFAULT_CONFIG);
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
        const mockCsvFilePaths = mockCsvFiles.map((file) => path.join(testDir, file));
        jest
            .spyOn(fs, 'readdirSync')
            .mockReturnValue(mockTestFiles);
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
    const baseConfig = {
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
                                },
                                {
                                    id: '67890',
                                    name: 'file2',
                                },
                            ],
                        },
                    };
                }),
            },
        };
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
                                },
                                {
                                    id: '67890',
                                    name: 'file2',
                                },
                            ],
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
                                },
                            ],
                        },
                    };
                }),
            },
        };
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
        const mockDrive = {};
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
        ];
        expect(await utils.getExistingSheetsFiles(mockDrive, mockConfig, mockFileList)).toEqual(mockFileList);
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
    ];
    const mockEmptyExistingSheetsFiles = [];
    it('should return the file ID if the file exists', () => {
        expect(utils.getExistingSheetsFileId('file1', mockExistingSheetsFiles)).toBe('12345');
    });
    it('should return null if the existing file does not have a valid ID', () => {
        expect(utils.getExistingSheetsFileId('file2', mockExistingSheetsFiles)).toBeNull();
    });
    it('should return null if the file does not exist', () => {
        expect(utils.getExistingSheetsFileId('file99', mockExistingSheetsFiles)).toBeNull();
    });
    it('should return null if the array existingSheetsFiles has the length of 0', () => {
        expect(utils.getExistingSheetsFileId('file1', mockEmptyExistingSheetsFiles)).toBeNull();
    });
});
describe('getCsvFolderId', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    const baseConfig = {
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
                                },
                                {
                                    id: 'OtherFolderId67890',
                                    name: 'csv',
                                },
                            ],
                        },
                    };
                }),
            },
        };
        const mockConfig = baseConfig;
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe('CsvFolderId12345');
    });
    it('should create a new folder in the target Google Drive folder and return its ID', async () => {
        const mockDrive = {
            files: {
                list: jest
                    .fn()
                    .mockImplementationOnce(() => {
                    return {
                        data: {
                            files: [],
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
                                },
                            ],
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
            },
        };
        const mockConfig = baseConfig;
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe('NewlyCreatedCsvFolderId12345');
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe('NewlyCreatedCsvFolderId12345');
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe('NewlyCreatedCsvFolderId12345');
    });
    it('should create a new folder at the root of My Drive and return its ID', async () => {
        const mockDrive = {
            files: {
                list: jest.fn().mockImplementation(() => {
                    return Promise.resolve({
                        data: {
                            files: [],
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
            },
        };
        const mockConfig = {
            ...baseConfig,
            targetDriveFolderId: 'root',
        };
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBe('NewlyCreatedCsvFolderId12345');
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
                            files: [],
                        },
                    };
                }),
                create: jest.fn().mockImplementation(() => {
                    return {
                        data: {},
                    };
                }),
            },
        };
        const mockConfig = baseConfig;
        await expect(utils.getCsvFolderId(mockDrive, mockConfig)).rejects.toThrow(C2gError);
    });
    it('should return null if config.saveOriginalFilesToDrive is false', async () => {
        const mockDrive = {};
        const mockConfig = {
            ...baseConfig,
            saveOriginalFilesToDrive: false,
        };
        expect(await utils.getCsvFolderId(mockDrive, mockConfig)).toBeNull();
    });
});
//# sourceMappingURL=utils.test.js.map