import { OAuth2Client } from 'google-auth-library';
export declare const TOKEN_PATH: string;
export interface CredentialsKey {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
}
export interface Credentials {
    installed?: CredentialsKey;
    web?: CredentialsKey;
}
/**
 * Check if the previously authorized token file exists.
 */
export declare function isAuthorized(): boolean;
/**
 * Read previously authorized tokens from the save file.
 * @returns The OAuth2Client object or null if no saved token exists.
 */
export declare function loadSavedToken(): OAuth2Client | null;
/**
 * Serialize credentials to a file compatible with GoogleAuth.fromJSON.
 * @param client The OAuth2Client object to serialize.
 */
export declare function saveToken(client: OAuth2Client): void;
/**
 * Load or request authorization to call Google APIs.
 * @returns The OAuth2Client object.
 */
export declare function authorize(): Promise<OAuth2Client>;
/**
 * Gets the user's email using the OAuth2Client object.
 * If the user is not authorized, return null
 */
export declare function getUserEmail(): Promise<string | null | undefined>;
