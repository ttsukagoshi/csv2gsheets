// Handle authentication and authorization with Google Drive API
// https://developers.google.com/drive/api/v3/quickstart/nodejs

import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import {
  CREDENTIALS_FILE_NAME,
  TOKEN_FILE_NAME,
  HOME_DIR,
} from './constants.js';
import { MESSAGES } from './messages.js';
import { X2sError } from './x2s-error.js';

// OAuth Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
];

// File paths
const CREDENTIALS_PATH = path.join(HOME_DIR, CREDENTIALS_FILE_NAME);
export const TOKEN_PATH = path.join(HOME_DIR, TOKEN_FILE_NAME);

/**
 * Check if the previously authorized token file exists.
 */
export function isAuthorized(): boolean {
  // Check if the credential file exists and return an error if it doesn't
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new X2sError(MESSAGES.error.x2sErrorCredentialsFileNotFound);
  }
  return fs.existsSync(TOKEN_PATH);
}

/**
 * Read previously authorized tokens from the save file.
 * @returns The OAuth2Client object or null if no saved token exists.
 */
export async function loadSavedToken(): Promise<OAuth2Client | null> {
  try {
    if (isAuthorized()) {
      const token = await fs.promises.readFile(TOKEN_PATH, 'utf8');
      return google.auth.fromJSON(JSON.parse(token)) as OAuth2Client;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

/**
 * Serialize credentials to a file compatible with GoogleAuth.fromJSON.
 * @param client The OAuth2Client object to serialize.
 */
async function saveToken(client: OAuth2Client): Promise<void> {
  const credentials = await fs.promises.readFile(CREDENTIALS_PATH, 'utf8');
  const parsedCredentials = JSON.parse(credentials);
  const key = parsedCredentials.installed || parsedCredentials.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    access_token: client.credentials.access_token,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request authorization to call Google APIs.
 * @returns The OAuth2Client object.
 */
export async function authorize(): Promise<OAuth2Client> {
  let client = await loadSavedToken();
  if (!client) {
    client = await authenticate({
      keyfilePath: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    if (client?.credentials) {
      await saveToken(client);
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
