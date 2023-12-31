// Handle authentication and authorization with Google Drive API
// https://developers.google.com/drive/api/v3/quickstart/nodejs

import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { CREDENTIALS_FILE_NAME, TOKEN_FILE_NAME, HOME_DIR } from './constants';
import { MESSAGES } from './messages';
import { C2gError } from './c2g-error';

// OAuth Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
];

// File paths
const CREDENTIALS_PATH = path.join(HOME_DIR, CREDENTIALS_FILE_NAME);
export const TOKEN_PATH = path.join(HOME_DIR, TOKEN_FILE_NAME);

// Interface
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
interface Token {
  type: string;
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
}

/**
 * Check if the previously authorized token file exists.
 */
export function isAuthorized(): boolean {
  // Check if the credential file exists and return an error if it doesn't
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new C2gError(MESSAGES.error.c2gErrorCredentialsFileNotFound);
  }
  return fs.existsSync(TOKEN_PATH);
}

/**
 * Read previously authorized tokens from the save file.
 * @returns The OAuth2Client object or null if no saved token exists.
 */
export function loadSavedToken(): OAuth2Client | null {
  if (isAuthorized()) {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    return google.auth.fromJSON(JSON.parse(token) as Token) as OAuth2Client;
  } else {
    return null;
  }
}

/**
 * Serialize credentials to a file compatible with GoogleAuth.fromJSON.
 * @param client The OAuth2Client object to serialize.
 */
export function saveToken(client: OAuth2Client): void {
  const credentialsStr = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  const parsedCredentials = JSON.parse(credentialsStr) as Credentials;
  if ('installed' in parsedCredentials || 'web' in parsedCredentials) {
    const key = parsedCredentials.installed ?? parsedCredentials.web;
    if (!key) {
      throw new C2gError(MESSAGES.error.c2gErrorInvalidCredentials);
    }
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      access_token: client.credentials.access_token,
      refresh_token: client.credentials.refresh_token,
    });
    fs.writeFileSync(TOKEN_PATH, payload);
  } else {
    throw new C2gError(MESSAGES.error.c2gErrorInvalidCredentials);
  }
}

/**
 * Load or request authorization to call Google APIs.
 * @returns The OAuth2Client object.
 */
export async function authorize(): Promise<OAuth2Client> {
  let client = loadSavedToken();
  if (!client) {
    client = await authenticate({
      keyfilePath: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    if (client?.credentials) {
      saveToken(client);
    }
    return client;
  } else {
    return client;
  }
}

/**
 * Gets the user's email using the OAuth2Client object.
 * If the user is not authorized, return null
 */
export async function getUserEmail(): Promise<string | null | undefined> {
  if (isAuthorized()) {
    const client = await authorize();
    try {
      return (await google.oauth2('v2').userinfo.get({ auth: client })).data
        .email;
    } catch {
      return null;
    }
  } else {
    return null;
  }
}
