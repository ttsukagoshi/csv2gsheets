// login command

import { authorize, isAuthorized, getUserEmail } from '../auth.js';

// Type definition for command options in login
type CommandOptions = {
  readonly status?: boolean;
};

export default async function login(options?: CommandOptions) {
  // If the option "status" is true, return the current user name
  if (options?.status) {
    if (isAuthorized()) {
      const email = await getUserEmail();
      console.info(`You are logged in as ${email ? email : 'UNKNOWN'}`);
    } else {
      console.info('You are not logged in');
    }
    return;
  } else {
    // Authorize the user
    await authorize();
  }
}
