// logout command

import fs from 'fs';
import { TOKEN_PATH } from '../auth.js';
import { MESSAGES } from '../messages.js';

/**
 * Logs out of the Google services by deleting the token file.
 */
export default async function logout(): Promise<void> {
  try {
    fs.unlinkSync(TOKEN_PATH);
    console.info(MESSAGES.log.youHaveBeenLoggedOut);
  } catch (error) {
    console.error(error);
  }
}
