export interface ConvertCommandOptions {
    readonly browse?: boolean;
    readonly configFilePath?: string;
    readonly dryRun?: boolean;
}
export interface CsvFileObj {
    name: string;
    basename: string;
    path: string;
    existingSheetsFileId: string | null;
}
/**
 * The main function of the convert command.
 * @param options The options passed to the convert command
 */
export default function convert(options: ConvertCommandOptions): Promise<void>;
