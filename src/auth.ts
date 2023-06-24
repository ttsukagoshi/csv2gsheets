// Handle authentication with Google Drive API

import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { CREDENTIALS_FILE_NAME, TOKEN_FILE_NAME, HOME_DIR } from './constants';

// OAuth Scopes
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(HOME_DIR, CREDENTIALS_FILE_NAME);
export const TOKEN_PATH = path.join(HOME_DIR, TOKEN_FILE_NAME);

/**
 * Read previously authorized tokens from the save file.
 * @returns The OAuth2Client object or null if no saved token exists.
 */
export async function loadSavedToken(): Promise<OAuth2Client | null> {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
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
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request authorization to call Google APIs.
 */
export default async function authorize(): Promise<OAuth2Client> {
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
