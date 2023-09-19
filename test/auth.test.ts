// Jest tests for ./src/auth.ts

import fs from 'fs';
import { authenticate } from '@google-cloud/local-auth';
import { google, oauth2_v2 } from 'googleapis';
import { OAuth2Client, JWT as JSONClient } from 'google-auth-library';

import * as auth from '../src/auth';
import { C2gError } from '../src/c2g-error';
import { MESSAGES } from '../src/messages';

jest.mock('fs');
jest.mock('@google-cloud/local-auth');
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
    jest
      .spyOn(google.auth, 'fromJSON')
      .mockImplementation(() => mockClient as unknown as JSONClient); // loadSavedToken
    // Act
    const result = await auth.authorize();
    // Assert
    expect(result).toEqual(mockClient);
  });

  it('should create and return a new OAuth2Client after running `authenticate` and `saveToken`', async () => {
    // Arrange
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true) // isAuthorized > fs.existsSync(CREDENTIALS_PATH)
      .mockReturnValueOnce(false); // isAuthorized > fs.existsSync(TOKEN_PATH)
    const mockAuthenticate = authenticate as jest.MockedFunction<
      typeof authenticate
    >;
    mockAuthenticate.mockResolvedValue(mockClient);
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(mockCredentials)); // saveToken
    jest.spyOn(fs, 'writeFileSync').mockImplementation(); // saveToken
    // Act
    const result = await auth.authorize();
    // Assert
    expect(result).toEqual(mockClient);
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      auth.TOKEN_PATH,
      JSON.stringify(mockToken),
    );
  });
});

describe('getUserEmail', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return null if the user is not authorized', async () => {
    // Arrange
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true) // isAuthorized > fs.existsSync(CREDENTIALS_PATH)
      .mockReturnValueOnce(false); // isAuthorized > fs.existsSync(TOKEN_PATH)
    // Act
    const result = await auth.getUserEmail();
    // Assert
    expect(result).toBeNull();
  });

  it('should return the user email if the user is authorized', async () => {
    // Arrange
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
    const mockUserEmail = 'mock@user.email.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true); // isAuthorized
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockToken)); // loadSavedToken
    jest
      .spyOn(google.auth, 'fromJSON')
      .mockImplementation(() => mockClient as unknown as JSONClient); // loadSavedToken
    jest.spyOn(google, 'oauth2').mockImplementation(() => {
      return {
        userinfo: {
          get: jest.fn().mockResolvedValue({
            data: {
              email: mockUserEmail,
            },
          }),
        },
      } as unknown as oauth2_v2.Oauth2;
    });
    // Act
    const result = await auth.getUserEmail();
    // Assert
    expect(result).toEqual(mockUserEmail);
  });

  it('should return null if there is a error in retrieving user email', async () => {
    // Arrange
    jest.spyOn(google, 'oauth2').mockImplementation(() => {
      return {
        userinfo: {
          get: jest.fn().mockRejectedValue(new Error('mock-error')),
        },
      } as unknown as oauth2_v2.Oauth2;
    });
    // Other arrangements are the same as the previous test:
    // 'should return the user email if the user is authorized'
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
    jest.spyOn(fs, 'existsSync').mockReturnValue(true); // isAuthorized
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockToken)); // loadSavedToken
    jest
      .spyOn(google.auth, 'fromJSON')
      .mockImplementation(() => mockClient as unknown as JSONClient); // loadSavedToken
    // Act
    const result = await auth.getUserEmail();
    // Assert
    expect(result).toBeNull();
  });
});
