// login command
import { authorize, isAuthorized, getUserEmail } from '../auth.js';
import { MESSAGES } from '../messages.js';
/**
 * Authorize the user.
 * If the option "status" is true, return the current user name
 * or a message that the user is not logged in.
 */
export default async function login(options) {
    if (options?.status) {
        if (isAuthorized()) {
            const email = await getUserEmail();
            console.info(MESSAGES.log.youAreLoggedInAs(email ? email : 'UNKNOWN'));
        }
        else {
            console.info(MESSAGES.log.youAreNotLoggedIn);
        }
        return;
    }
    else {
        // Authorize the user
        await authorize();
        const email = await getUserEmail();
        console.info(MESSAGES.log.youAreLoggedInAs(email ? email : 'UNKNOWN'));
    }
}
//# sourceMappingURL=login.js.map