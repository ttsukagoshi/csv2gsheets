// Jest test for the logout command in ./src/commands/logout.ts

import fs from 'fs';
import logout from '../src/commands/logout';
import { TOKEN_PATH } from '../src/auth';
import { MESSAGES } from '../src/messages';

jest.mock('fs');

describe('logout', () => {
  it('should delete the token file and log out', () => {
    jest.spyOn(console, 'info').mockImplementation();
    logout();
    expect(fs.unlinkSync).toHaveBeenCalledWith(TOKEN_PATH);
    expect(console.info).toHaveBeenCalledWith(
      MESSAGES.log.youHaveBeenLoggedOut,
    );
  });
});
