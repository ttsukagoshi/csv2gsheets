// init command
// Import the necessary modules
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { isAuthorized } from '../auth.js';
import { CONFIG_FILE_NAME } from '../constants.js';
import login from './login.js';
import { MESSAGES } from '../messages.js';
import * as utils from '../utils.js';
/**
 * Create a config file `c2g.config.json` in the current directory.
 * If a config file already exists, prompt the user to overwrite it.
 * If the option "login" is true, authorize the user as well.
 * This is same as running `c2g init && c2g login`.
 */
export default async function init(options) {
    // If a config file already exists, prompt the user to overwrite it
    if (fs.existsSync(path.join(process.cwd(), CONFIG_FILE_NAME))) {
        const overwrite = (await inquirer.prompt([
            {
                name: 'overwrite',
                type: 'confirm',
                message: MESSAGES.prompt.overwriteExistingConfigFileYN,
                default: false,
            },
        ]));
        if (overwrite.overwrite) {
            await utils.createConfigFile();
        }
        else {
            // exit without doing anything
            console.info(MESSAGES.log.noChangesWereMade);
        }
    }
    else {
        await utils.createConfigFile();
    }
    // If the option "login" is true, authorize the user
    if (options?.login) {
        await login({ status: true });
        if (!isAuthorized()) {
            console.info(MESSAGES.log.loggingIn);
            await login();
        }
    }
}
//# sourceMappingURL=init.js.map