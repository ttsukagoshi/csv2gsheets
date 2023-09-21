// Jest test for the init command in ./src/commands/init.ts
import fs from 'fs';
import inquirer from 'inquirer';
import * as auth from '../src/auth';
import login from '../src/commands/login';
import init from '../src/commands/init';
import { MESSAGES } from '../src/messages';
import * as utils from '../src/utils';
jest.mock('fs');
jest.mock('inquirer');
jest.mock('../src/commands/login');
describe('init', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should create a config file if it does not exist', async () => {
        // Arrange
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(utils, 'createConfigFile').mockResolvedValue();
        jest.spyOn(inquirer, 'prompt').mockResolvedValue({});
        // Act
        await init();
        // Assert
        expect(fs.existsSync).toHaveBeenCalledTimes(1);
        expect(inquirer.prompt).not.toHaveBeenCalled();
        expect(utils.createConfigFile).toHaveBeenCalledTimes(1);
    });
    it('should proceed with the login process if options.login is true and isAuthorized returns false', async () => {
        // Arrange
        const mockLogin = login;
        mockLogin.mockImplementation(() => {
            return Promise.resolve();
        });
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(utils, 'createConfigFile').mockResolvedValue();
        jest.spyOn(auth, 'isAuthorized').mockReturnValue(false);
        jest.spyOn(console, 'info').mockImplementation();
        // Act
        await init({ login: true });
        // Assert
        expect(mockLogin).toHaveBeenCalledTimes(2);
        expect(console.info).toHaveBeenCalledWith(MESSAGES.log.loggingIn);
    });
    describe('when the config file exists, ask the user whether to overwrite the file', () => {
        it('should overwrite the config file if the user response is `Y` for "yes"', async () => {
            // Arrange
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(inquirer, 'prompt').mockResolvedValue({
                overwrite: true,
            });
            jest.spyOn(utils, 'createConfigFile').mockResolvedValue();
            jest.spyOn(console, 'info').mockImplementation();
            // Act
            await init();
            // Assert
            expect(fs.existsSync).toHaveBeenCalledTimes(1);
            expect(inquirer.prompt).toHaveBeenCalledTimes(1);
            expect(utils.createConfigFile).toHaveBeenCalledTimes(1);
            expect(console.info).not.toHaveBeenCalled();
        });
        it('should not overwrite the config file if the user response is `N` for "no"', async () => {
            // Arrange
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(inquirer, 'prompt').mockResolvedValue({
                overwrite: false,
            });
            jest.spyOn(utils, 'createConfigFile').mockResolvedValue();
            jest.spyOn(console, 'info').mockImplementation();
            // Act
            await init();
            // Assert
            expect(fs.existsSync).toHaveBeenCalledTimes(1);
            expect(inquirer.prompt).toHaveBeenCalledTimes(1);
            expect(utils.createConfigFile).not.toHaveBeenCalled();
            expect(console.info).toHaveBeenCalledTimes(1);
            expect(console.info).toHaveBeenCalledWith(MESSAGES.log.noChangesWereMade);
        });
    });
});
//# sourceMappingURL=init.test.js.map