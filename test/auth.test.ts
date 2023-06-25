// import authorize from '../src/auth';
import { loadSavedToken } from '../src/auth';

import fs from 'fs';
import { google } from 'googleapis';
// import { OAuth2Client } from 'google-auth-library';

describe('loadSavedToken', () => {
  it('should return null if no saved token exists', async () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Act
    const result = await loadSavedToken();

    // Assert
    expect(result).toBeNull();
  });

  it('should return an OAuth2Client object if a saved token exists', async () => {
    // Arrange
    const token = {
      access_token: 'ACCESS_TOKEN',
      refresh_token: 'REFRESH_TOKEN',
      scope: 'https://www.googleapis.com/auth/drive',
      token_type: 'authorized_user',
      expiry_date: 1234567890,
    };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(JSON.stringify(token));
    google.auth.fromJSON = jest.fn().mockReturnValue({ credentials: token });
    // Act
    const result = await loadSavedToken();

    // Assert
    expect(result?.credentials.access_token).toBe(token.access_token);
    expect(result?.credentials.refresh_token).toBe(token.refresh_token);
    expect(result?.credentials.scope).toBe(token.scope);
    expect(result?.credentials.token_type).toBe(token.token_type);
    expect(result?.credentials.expiry_date).toBe(token.expiry_date);
  });

  it('should return null if there is an error reading the token file', async () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockRejectedValue(new Error('Failed to read file'));

    // Act
    const result = await loadSavedToken();

    // Assert
    expect(result).toBeNull();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

/*
describe('authorize', () => {
  it('should return an OAuth2Client object if a saved token exists', async () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(
      JSON.stringify({
        installed: {
          client_id: 'CLIENT_ID',
          client_secret: 'CLIENT_SECRET',
        },
      })
    );
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google.auth.fromJSON = jest.fn((tokenObj: OAuth2Client) => tokenObj) as any;
    
    // Act
    const result = await authorize();

    // Assert

  });
});
*/
