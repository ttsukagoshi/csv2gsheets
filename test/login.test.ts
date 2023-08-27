// Jest test for the login command in ./src/commands/login.ts

import login from '../src/commands/login';
import * as auth from '../src/auth';
import { MESSAGES } from '../src/messages';

jest.mock('../src/auth');

describe('login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call authorize if options.status is not true', async () => {
    await login();
    expect(auth.authorize).toHaveBeenCalledTimes(1);
  });

  it('should not call authorize and should call isAuthorized if options.status is true', async () => {
    const mockedAuth = auth as jest.Mocked<typeof auth>;
    mockedAuth.isAuthorized.mockReturnValue(false);
    jest.spyOn(console, 'info').mockImplementation();
    await login({ status: true });
    expect(auth.authorize).not.toHaveBeenCalled();
    expect(auth.isAuthorized).toHaveBeenCalledTimes(1);
    // should log the "not logged in" message
    expect(console.info).toHaveBeenCalledWith(MESSAGES.log.youAreNotLoggedIn);
  });

  it('should log the user email if isAuthorized returns true and getUserEmail returns a value', async () => {
    const email = 'test@example.com';
    const mockedAuth = auth as jest.Mocked<typeof auth>;
    jest.spyOn(console, 'info').mockImplementation();
    mockedAuth.isAuthorized.mockReturnValue(true);
    mockedAuth.getUserEmail.mockResolvedValue(email);
    await login({ status: true });
    expect(auth.getUserEmail).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(
      MESSAGES.log.youAreLoggedInAs(email),
    );
  });

  it('should log as UNKNOWN if isAuthorized returns true and getUserEmail returns a nullish value', async () => {
    const email = null;
    const mockedAuth = auth as jest.Mocked<typeof auth>;
    jest.spyOn(console, 'info').mockImplementation();
    mockedAuth.isAuthorized.mockReturnValue(true);
    mockedAuth.getUserEmail.mockResolvedValue(email);
    await login({ status: true });
    expect(console.info).toHaveBeenCalledWith(
      MESSAGES.log.youAreLoggedInAs('UNKNOWN'),
    );
  });
});
