/**
 * Find .js files in the given directory and its subfolders, and return an array of file objects,
 * each containing the .js file's full path and its file name without the extension.
 * @param {string} dir The directory to search.
 * @param {any[]} jsFileList The existing array of TargetJsFile objects, for recursive calls.
 * @returns The array of file objects containing the .js file's full path and its file name without the extension.
 */
export function findJsFiles(dir: string, jsFileList?: any[]): any[];
/**
 * Create a string of regular expressions based on the file names
 * in the given array of file objects.
 * The array of file objects is created by the function findJsFiles().
 * @param {any[]} fileObjArr The array of file objects created by findJsFiles().
 * @returns {RegExp[]} The array of regular expressions.
 */
export function createRegexpFromFileNames(fileObjArr: any[]): RegExp[];
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
export function replaceFileContent(fileContent: string, regexp: RegExp, extension: string): string;
/**
 * The main function to add the file extension .js
 * in the respective internal import statements
 * @param {string} targetPath The path to the folder containing the .js files to be modified.
 */
export function postbuild(targetPath: string): void;
export const TARGET_REGEXP_STR: "^(import (\\S*, )?({[^}]*}|\\S*( as \\S*)?) from '\\.{1,2}\\/[^']*{{fileName}})(';)$";
