interface LoginCommandOptions {
    readonly status?: boolean;
}
/**
 * Authorize the user.
 * If the option "status" is true, return the current user name
 * or a message that the user is not logged in.
 */
export default function login(options?: LoginCommandOptions): Promise<void>;
export {};
