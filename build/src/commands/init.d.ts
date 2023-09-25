interface InitCommandOptions {
    readonly login?: boolean;
}
/**
 * Create a config file `c2g.config.json` in the current directory.
 * If a config file already exists, prompt the user to overwrite it.
 * If the option "login" is true, authorize the user as well.
 * This is same as running `c2g init && c2g login`.
 */
export default function init(options?: InitCommandOptions): Promise<void>;
export {};
