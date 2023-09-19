interface TargetJsFile {
    filePath: string;
    fileName: string;
}
/**
 * Find .js files in the given directory and its subfolders, and return an array of TargetJsFile objects,
 * each containing the .js file's full path and its file name without the extension.
 * @param dir The directory to search.
 * @param jsFileList The existing array of TargetJsFile objects, for recursive calls.
 * @returns The array of TargetJsFile objects.
 */
export declare function findJsFiles(dir: string, jsFileList?: TargetJsFile[]): TargetJsFile[];
export {};
