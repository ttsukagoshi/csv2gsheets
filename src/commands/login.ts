// login command

import { authorize, isAuthorized, getUserEmail } from '../auth';
import { MESSAGES } from '../messages';

// Type definition for command options in login
interface CommandOptions {
  readonly status?: boolean;
}

/**
 * Authorize the user.
 * If the option "status" is true, return the current user name
 * or a message that the user is not logged in.
 */
export default async function login(options?: CommandOptions): Promise<void> {
  if (options?.status) {
    if (isAuthorized()) {
      const email = await getUserEmail();
      console.info(MESSAGES.log.youAreLoggedInAs(email ? email : 'UNKNOWN'));
    } else {
      console.info(MESSAGES.log.youAreNotLoggedIn);
    }
    return;
  } else {
    // Authorize the user
    await authorize();
    const email = await getUserEmail();
    console.info(MESSAGES.log.youAreLoggedInAs(email ? email : 'UNKNOWN'));
  }
}
