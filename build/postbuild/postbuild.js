// This is a simple script to add the file extension .js in the respective import statements
// See ./postbuild/README.md for more details.
/* eslint-disable no-useless-escape */
import fs from 'fs';
import path from 'path';
// The path to the folder containing the .js files to be modified.
// const targetPath = path.join(process.cwd(), 'build', 'src');
// The target strings to be modified.
// prettier-ignore
// const targetRegexStr = "^import (\S*, )?({[^}]*}|\S*) from '\./[^']*{{fileName}}';$";
/**
 * Find .js files in the given directory and its subfolders, and return an array of TargetJsFile objects,
 * each containing the .js file's full path and its file name without the extension.
 * @param dir The directory to search.
 * @param jsFileList The existing array of TargetJsFile objects, for recursive calls.
 * @returns The array of TargetJsFile objects.
 */
export function findJsFiles(dir, jsFileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach((fileDirent) => {
        const filePath = path.join(dir, fileDirent.name);
        const extName = path.extname(filePath);
        if (fileDirent.isDirectory()) {
            findJsFiles(filePath, jsFileList);
        }
        else if (extName === '.js') {
            jsFileList.push({
                filePath: filePath,
                fileName: fileDirent.name.replace(extName, ''),
            });
        }
    });
    return jsFileList;
}
/*
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
 * Function to search for the target strings in the given files
 * and add '.js' to the respective target strings.
 * @param {string[]} targetFiles
 * @param {string[]} targetStrings
 * @returns {void}

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
*/
//# sourceMappingURL=postbuild.js.map