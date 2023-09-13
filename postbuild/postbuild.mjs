// This is a simple script to add the file extension .js in the respective import statements
// of all targeted strings in the .js files in the ./build/src folder and its subfolders.
// The script will add file extensions to all local import statements:
// e.g. import { foo } from './foo' => import { foo } from './foo.js'
// This script is run together with `npx tsc` during the `npm run build` command.

import fs from 'fs';
import path from 'path';

// The path to the folder containing the .js files to be modified.
const targetPath = path.join(process.cwd(), 'build', 'src');

// The target strings to be modified.
const targetStrings = [
  "import { authorize, isAuthorized, getUserEmail } from '../auth';",
  "import { authorize, isAuthorized } from '../auth';",
  "import { isAuthorized } from '../auth';",
  "import { TOKEN_PATH } from '../auth';",
  "import { CREDENTIALS_FILE_NAME, TOKEN_FILE_NAME, HOME_DIR } from './constants';",
  "import { Config, CONFIG_FILE_NAME } from '../constants';",
  "import { CREDENTIALS_FILE_NAME } from './constants';",
  "import { CONFIG_FILE_NAME } from '../constants';",
  "import { CONFIG_FILE_NAME, DEFAULT_CONFIG } from '../constants';",
  "import { MESSAGES } from '../messages';",
  "import { MESSAGES } from './messages';",
  "import { C2gError } from '../c2g-error';",
  "import { C2gError } from './c2g-error';",
  "import { PACKAGE_JSON } from './package';",
  "import { spinner, stopSpinner } from './utils';",
  "import convert from './commands/convert';",
  "import init from './commands/init';",
  "import login from './commands/login';",
  "import login from './login';",
  "import logout from './commands/logout';",
];

/**
 * Find .js files in the given directory and its subfolders and return an array of file paths.
 * @param {string} dir
 * @param {string[]} fileList
 * @returns {string[]} The array of .js file paths.
 */
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.lstatSync(filePath);
    if (fileStat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (path.extname(filePath) === '.js') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

/**
 * Function to search for the target strings in the given files
 * and add '.js' to the respective target strings.
 * @param {string[]} targetFiles
 * @param {string[]} targetStrings
 * @returns {void}
 */
function addJsExtensions(targetFiles, targetStrings) {
  targetFiles.forEach((file) => {
    let fileContent = fs.readFileSync(file, 'utf8');
    targetStrings.forEach((targetString) => {
      if (fileContent.includes(targetString)) {
        fileContent = fileContent.replace(
          new RegExp(targetString, 'g'),
          `${targetString.replace("';", ".js';")}`,
        );
      }
    });
    fs.writeFileSync(file, fileContent, 'utf8');
  });
}

addJsExtensions(findJsFiles(targetPath), targetStrings);
/*
console.log(
  'build-replace.js: File extensions added to the import statements.',
);
*/
