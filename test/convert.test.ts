// Jest test for the convert command in ./src/commands/convert.ts

import fs from 'fs';
import path from 'path';
import { Config } from '../src/constants';
import {
  readConfigFileSync,
  validateConfig,
  getCsvFilePaths,
} from '../src/commands/convert';
import { C2gError } from '../src/c2g-error';

describe('readConfigFileSync', () => {
  const configFilePath = '/path/to/config.json';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the contents of the config file as an object', () => {
    const config = {
      sourceDir: '/path/to/source',
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
    expect(readConfigFileSync(configFilePath)).toEqual(config);
  });

  it('should throw an error if the config file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => readConfigFileSync(configFilePath)).toThrow(C2gError);
  });

  it('should throw an error if the config file is not valid JSON', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('not valid JSON');
    expect(() => readConfigFileSync(configFilePath)).toThrow();
  });
});

describe('validateConfig', () => {
  const testDir = path.join(__dirname, 'testDir');

  beforeAll(() => {
    // Create a test directory
    fs.mkdirSync(testDir);
  });

  afterAll(() => {
    // Remove the test directory and its contents
    fs.rmSync(testDir, { recursive: true });
  });

  it('should return the config object if it is valid', () => {
    const config = {
      sourceDir: testDir,
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    };
    expect(validateConfig(config)).toEqual(config);
  });

  it('should throw an error if sourceDir is not a string', () => {
    const config = {
      sourceDir: 123,
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    } as unknown as Config;
    expect(() => validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if targetDriveFolderId is not a string', () => {
    const config = {
      sourceDir: '/path/to/source',
      targetDriveFolderId: 123,
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    } as unknown as Config;
    expect(() => validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if updateExistingGoogleSheets is not a boolean', () => {
    const config = {
      sourceDir: '/path/to/source',
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: 'true',
      saveOriginalFilesToDrive: false,
    } as unknown as Config;
    expect(() => validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if saveOriginalFilesToDrive is not a boolean', () => {
    const config = {
      sourceDir: '/path/to/source',
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: 'false',
    } as unknown as Config;
    expect(() => validateConfig(config)).toThrow(TypeError);
  });

  it('should throw an error if sourceDir is not a valid path', () => {
    const config = {
      sourceDir: '/path/to/nonexistent/directory',
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
      saveOriginalFilesToDrive: false,
    };
    expect(() => validateConfig(config)).toThrow(C2gError);
  });

  it('should throw an error if the config object does not contain 4 properties', () => {
    const config = {
      sourceDir: testDir,
      targetDriveFolderId: '12345',
      updateExistingGoogleSheets: true,
    } as unknown as Config;
    expect(() => validateConfig(config)).toThrow(C2gError);
  });
});

describe('getCsvFilePaths', () => {
  const testDir = path.join(__dirname, 'testDir');
  const testDir2 = path.join(__dirname, 'testDir2');

  beforeAll(() => {
    // Create a test directory with some CSV files
    fs.mkdirSync(testDir);
    fs.mkdirSync(testDir2);
    fs.writeFileSync(path.join(testDir, 'file1.csv'), '');
    fs.writeFileSync(path.join(testDir, 'file2.CSV'), '');
    fs.writeFileSync(path.join(testDir, 'file3.txt'), '');
  });

  afterAll(() => {
    // Remove the test directory and its contents
    fs.rmSync(testDir, { recursive: true });
    fs.rmSync(testDir2, { recursive: true });
  });

  it('should return an array with the full path of a single CSV file', () => {
    const csvFiles = getCsvFilePaths(path.join(testDir, 'file1.csv'));
    expect(csvFiles).toEqual([path.join(testDir, 'file1.csv')]);
  });

  it('should return an array with the full path of all CSV files in a directory', () => {
    const csvFiles = getCsvFilePaths(testDir);
    expect(csvFiles).toEqual([
      path.join(testDir, 'file1.csv'),
      path.join(testDir, 'file2.CSV'),
    ]);
  });

  it('should return an empty array if there are no CSV files in a directory', () => {
    const csvFiles = getCsvFilePaths(testDir2);
    expect(csvFiles).toEqual([]);
  });

  it('should return an "ENOTDIR: not a directory" error if the given path is neither a CSV file path or a directory path', () => {
    expect(() => {
      getCsvFilePaths(path.join(testDir, 'file3.txt'));
    }).toThrowError(
      `ENOTDIR: not a directory, scandir '${path.join(testDir, 'file3.txt')}'`,
    );
  });
});
