// logout command

import fs from 'fs';
import { TOKEN_PATH } from '../auth';
import { MESSAGES } from '../messages';

/**
 * Logs out of the Google services by deleting the token file.
 */
export default function logout(): void {
  fs.unlinkSync(TOKEN_PATH);
  console.info(MESSAGES.log.youHaveBeenLoggedOut);
}
