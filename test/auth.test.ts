// Jest tests for ./src/auth.ts

import fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import * as auth from '../src/auth';
import { C2gError } from '../src/c2g-error';
import { MESSAGES } from '../src/messages';

jest.mock('fs');
jest.mock('googleapis');
jest.mock('google-auth-library');

describe('isAuthorized', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true if credential file exists', () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    // Act
    const result = auth.isAuthorized();
    // Assert
    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if credential file does not exist', () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    // Act
    const result = () => auth.isAuthorized();
    // Assert
    expect(result).toThrow(
      new C2gError(MESSAGES.error.c2gErrorCredentialsFileNotFound),
    );
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
  });
});

describe('loadSavedToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return null if token file does not exist', () => {
    // Arrange
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    // Act & Assert
    expect(auth.loadSavedToken()).toBeNull();
  });

  it('should return OAuth2Client if token file exists', () => {
    // Arrange
    const mockToken = {
      token: 'mock-token-string',
    };
    jest.spyOn(google.auth, 'fromJSON').mockImplementation();
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockToken));
    // Act
    auth.loadSavedToken();
    // Assert
    expect(google.auth.fromJSON).toHaveBeenCalledTimes(1);
  });
});

describe('saveToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockClient = {
    credentials: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    },
  } as unknown as OAuth2Client;

  it('should throw an error if credentials file does not have top level key of `installed` or `web`', () => {
    // Arrange
    const mockCredentials = {
      unknownKey: {},
    } as unknown as auth.Credentials;
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(mockCredentials));
    // Act & Assert
    expect(() => auth.saveToken(mockClient)).toThrow(
      new C2gError(MESSAGES.error.c2gErrorInvalidCredentials),
    );
  });

  it('should throw an error if credentials file does not have CredentialsKey values', () => {
    // Arrange
    const mockCredentials = {
      installed: undefined,
      web: '',
    } as unknown as auth.Credentials;
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(mockCredentials));
    // Act & Assert
    expect(() => auth.saveToken(mockClient)).toThrow(
      new C2gError(MESSAGES.error.c2gErrorInvalidCredentials),
    );
  });

  it('should save the token file without error', () => {
    // Arrange
    const mockCredentials: auth.Credentials = {
      installed: {
        client_id: 'mock-client-id',
        client_secret: 'mock-client-secret',
      } as unknown as auth.CredentialsKey,
    };
    const mockPayload = JSON.stringify({
      type: 'authorized_user',
      client_id: mockCredentials.installed?.client_id,
      client_secret: mockCredentials.installed?.client_secret,
      access_token: mockClient.credentials.access_token,
      refresh_token: mockClient.credentials.refresh_token,
    });
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(mockCredentials));
    jest.spyOn(fs, 'writeFileSync').mockImplementation();
    // Act
    auth.saveToken(mockClient);
    // Assert
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(auth.TOKEN_PATH, mockPayload);
  });
});

describe('authorize', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const mockClient = {
    credentials: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    },
  } as unknown as OAuth2Client;
  const mockCredentials: auth.Credentials = {
    installed: {
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
    } as unknown as auth.CredentialsKey,
  };
  const mockToken = {
    type: 'authorized_user',
    client_id: mockCredentials.installed?.client_id,
    client_secret: mockCredentials.installed?.client_secret,
    access_token: mockClient.credentials.access_token,
    refresh_token: mockClient.credentials.refresh_token,
  };

  it('should return OAuth2Client if token file exists', async () => {
    // Arrange
    jest.spyOn(fs, 'existsSync').mockReturnValue(true); // isAuthorized
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockToken)); // loadSavedToken
    jest.spyOn(google.auth, 'fromJSON').mockImplementation(); // loadSavedToken
    // Act
    const result = await auth.authorize();
    // Assert
    expect(result).toEqual(mockToken);
  });
});
