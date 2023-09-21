// This is a simple script to add the file extension .js in the respective import statements
// See ./postbuild/README.md for more details.
/* eslint-disable no-useless-escape */
import fs from 'fs';
import path from 'path';
// The target strings to be modified.
// prettier-ignore
export const TARGET_REGEXP_STR = "^(import (\\S*, )?({[^}]*}|\\S*( as \\S*)?) from '\\.{1,2}\\/[^']*{{fileName}})(';)$";
/**
 * Find .js files in the given directory and its subfolders, and return an array of file objects,
 * each containing the .js file's full path and its file name without the extension.
 * @param {string} dir The directory to search.
 * @param {any[]} jsFileList The existing array of TargetJsFile objects, for recursive calls.
 * @returns The array of file objects containing the .js file's full path and its file name without the extension.
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return jsFileList;
}
/**
 * Create a string of regular expressions based on the file names
 * in the given array of file objects.
 * The array of file objects is created by the function findJsFiles().
 * @param {any[]} fileObjArr The array of file objects created by findJsFiles().
 * @returns {RegExp[]} The array of regular expressions.
 */
export function createRegexpFromFileNames(fileObjArr) {
    const regexpArr = [];
    fileObjArr.forEach((fileObj) => {
        regexpArr.push(new RegExp(
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        TARGET_REGEXP_STR.replace('{{fileName}}', fileObj.fileName), 'gm'));
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return regexpArr;
}
/**
 * Add '.js' to the part of the given file content
 * that matches given regular expression.
 * @param {string} fileContent The file content to be modified.
 * @param {RegExp} regexp The regular expression to be replaced.
 * @param {string} extension The extension to be added. e.g., ".js"
 * @returns {string} The modified file content. If the given file content does not match the given regular expression, the file content is returned as is.
 * @example
 * ```
 * replaceFileContent("import { authorize, isAuthorized } from '../auth';", /import (\S*, )?({[^}]*}|\S*) from '\.\/[^']*auth';/gm);
 * // returns "import { authorize, isAuthorized } from '../auth.js';"
 * ```
 */
export function replaceFileContent(fileContent, regexp, extension) {
    if (fileContent.match(regexp)) {
        fileContent = fileContent.replace(regexp, `$1${extension}$5`); // insert '.js' before the last single quote
    }
    return fileContent;
}
/**
 * The main function to add the file extension .js
 * in the respective internal import statements
 * @param {string} targetPath The path to the folder containing the .js files to be modified.
 */
export function postbuild(targetPath) {
    // console.log(`targetPath: ${targetPath}`);
    // The array of file objects containing the .js file's full path and its file name without the extension.
    const jsFileList = findJsFiles(targetPath);
    // console.log(`jsFileList: ${JSON.stringify(jsFileList, null, 2)}`);
    // The array of regular expressions.
    const regexpArr = createRegexpFromFileNames(jsFileList);
    jsFileList.forEach((fileObj) => {
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        let fileContent = fs.readFileSync(fileObj.filePath, 'utf8');
        regexpArr.forEach((regexp) => {
            fileContent = replaceFileContent(fileContent, regexp, '.js');
        });
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        fs.writeFileSync(fileObj.filePath, fileContent, 'utf8');
    });
}
postbuild(path.join(process.cwd(), 'build', 'src'));
//# sourceMappingURL=postbuild.mjs.map