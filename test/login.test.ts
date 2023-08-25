/* eslint-disable @typescript-eslint/no-unsafe-call */
import login from '../src/commands/login';
import { authorize, isAuthorized, getUserEmail } from '../src/auth';
import { MESSAGES } from '../src/messages';

jest.mock('../src/auth');

describe('login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call authorize if options.status is not true', async () => {
    await login();
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  it('should not call authorize if options.status is true', async () => {
    await login({ status: true });
    expect(authorize).not.toHaveBeenCalled();
  });

  it('should call isAuthorized and getUserEmail if options.status is true and the user is authorized', async () => {
    const email = 'test@example.com';
    jest.spyOn(console, 'info').mockImplementation();
    isAuthorized.mockReturnValue(true);
    getUserEmail.mockResolvedValue(email);
    await login({ status: true });
    expect(isAuthorized).toHaveBeenCalledTimes(1);
    expect(getUserEmail).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(
      MESSAGES.log.youAreLoggedInAs(email),
    );
  });
  /*
  it('should call isAuthorized if options.status is true', async () => {
    const isAuthorizedMock = jest.fn();
    isAuthorized.mockImplementation(isAuthorizedMock);
    await login({ status: true });
    expect(isAuthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('should call getUserEmail if isAuthorized returns true', async () => {
    const getUserEmailMock = jest.fn();
    getUserEmail.mockImplementation(getUserEmailMock);
    mocked(isAuthorized).mockReturnValue(true);
    await login({ status: true });
    expect(getUserEmailMock).toHaveBeenCalledTimes(1);
  });

  it('should log the user email if isAuthorized returns true and getUserEmail returns a value', async () => {
    const email = 'test@example.com';
    mocked(isAuthorized).mockReturnValue(true);
    mocked(getUserEmail).mockResolvedValue(email);
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation();
    await login({ status: true });
    expect(consoleInfoMock).toHaveBeenCalledWith(
      `You are logged in as ${email}`,
    );
  });

  it('should log a message if isAuthorized returns true and getUserEmail returns undefined', async () => {
    mocked(isAuthorized).mockReturnValue(true);
    mocked(getUserEmail).mockResolvedValue(undefined);
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation();
    await login({ status: true });
    expect(consoleInfoMock).toHaveBeenCalledWith(
      'You are logged in as UNKNOWN',
    );
  });

  it('should log a message if isAuthorized returns false', async () => {
    mocked(isAuthorized).mockReturnValue(false);
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation();
    await login({ status: true });
    expect(consoleInfoMock).toHaveBeenCalledWith('You are not logged in');
  });
  */
});
