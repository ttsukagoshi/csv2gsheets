import * as postbuild from '../postbuild/postbuild.mjs';

import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('findJsFiles', () => {
  const targetPath = path.join('./test', 'build', 'src');
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should return an array of file objects', () => {
    jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValueOnce([
        { name: 'test1.js', isDirectory: () => false } as unknown as fs.Dirent,
        { name: 'test2.js', isDirectory: () => false } as unknown as fs.Dirent,
        { name: 'test3.csv', isDirectory: () => false } as unknown as fs.Dirent,
        {
          name: 'testSubDirectory',
          isDirectory: () => true,
        } as unknown as fs.Dirent,
      ])
      .mockReturnValueOnce([
        { name: 'test4.js', isDirectory: () => false } as unknown as fs.Dirent,
      ]);
    const jsFiles = postbuild.findJsFiles(targetPath);
    expect(jsFiles.length).toBe(3);
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[0].filePath).toBe(path.join(targetPath, 'test1.js'));
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[0].fileName).toBe('test1');
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[1].filePath).toBe(path.join(targetPath, 'test2.js'));
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[1].fileName).toBe('test2');
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[2].filePath).toBe(
      path.join(targetPath, 'testSubDirectory', 'test4.js'),
    );
    // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
    expect(jsFiles[2].fileName).toBe('test4');
  });

  it('should return an empty array if no .js files are found', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
    const jsFiles = postbuild.findJsFiles(targetPath);
    expect(jsFiles.length).toBe(0);
  });
});

describe('createRegexpFromFileNames', () => {
  it('should return an array of RegExp objects', () => {
    const fileObjArr = [
      {
        filePath: 'path1/test1.js',
        fileName: 'test1',
      },
      {
        filePath: 'path2/test2.js',
        fileName: 'test2',
      },
    ];
    const regexpArr = postbuild.createRegexpFromFileNames(fileObjArr);
    expect(regexpArr[0]).toBeInstanceOf(RegExp);
    expect(regexpArr[0]).toEqual(
      new RegExp(
        postbuild.TARGET_REGEXP_STR.replace('{{fileName}}', 'test1'),
        'gm',
      ),
    );
    expect(regexpArr[1]).toBeInstanceOf(RegExp);
    expect(regexpArr[1]).toEqual(
      new RegExp(
        postbuild.TARGET_REGEXP_STR.replace('{{fileName}}', 'test2'),
        'gm',
      ),
    );
  });

  it('should return an empty array if no file objects are passed', () => {
    const regexpArr = postbuild.createRegexpFromFileNames([]);
    expect(regexpArr.length).toBe(0);
  });
});

describe('replaceFileContent', () => {
  it('should replace the content of a file', () => {
    // Arrange
    const fileContent =
      "import { test1 } from './test1';\nimport test2, { test2sub } from './test2';\nimport fs from 'fs';\nimport test2 from 'test2';\nimport * as utils from './test2';\nconst test2 = () => {\n  console.log('test2');\n};\n\nexport { test2 };\n";
    const regexp = new RegExp(
      postbuild.TARGET_REGEXP_STR.replace('{{fileName}}', 'test2'),
      'gm',
    );
    const extension = '.js';
    // Act & Assert
    expect(fileContent.match(regexp)).not.toBeNull();
    expect(postbuild.replaceFileContent(fileContent, regexp, extension)).toBe(
      "import { test1 } from './test1';\nimport test2, { test2sub } from './test2.js';\nimport fs from 'fs';\nimport test2 from 'test2';\nimport * as utils from './test2.js';\nconst test2 = () => {\n  console.log('test2');\n};\n\nexport { test2 };\n",
    );
  });
});

describe('postbuild', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should add '.js' to the part of the file content that matches the regular expressions created from the file names in the given directory and its subfolders", () => {
    // Arrange
    const targetPath = path.join(process.cwd());
    const testFileContent =
      "import { test1Func1, test1Func2 } from '../test1';";
    jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue([
        { name: 'test1.js', isDirectory: () => false } as unknown as fs.Dirent,
        { name: 'test2.js', isDirectory: () => false } as unknown as fs.Dirent,
        { name: 'test3.csv', isDirectory: () => false } as unknown as fs.Dirent,
      ]);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(testFileContent);
    jest.spyOn(fs, 'writeFileSync').mockImplementation();
    // Act
    postbuild.postbuild(targetPath);
    // Assert
    expect(fs.readdirSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenNthCalledWith(
      1,
      path.join(targetPath, 'test1.js'),
      'utf8',
    );
    expect(fs.readFileSync).toHaveBeenNthCalledWith(
      2,
      path.join(targetPath, 'test2.js'),
      'utf8',
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(
      1,
      path.join(targetPath, 'test1.js'),
      "import { test1Func1, test1Func2 } from '../test1.js';",
      'utf8',
    );
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(
      2,
      path.join(targetPath, 'test2.js'),
      "import { test1Func1, test1Func2 } from '../test1.js';",
      'utf8',
    );
  });
});
