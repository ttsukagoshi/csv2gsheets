// Jest test for the C2gError class in ./src/c2g-error.ts
import { C2gError } from '../src/c2g-error';
describe('C2gError', () => {
    it('should create an instance with the correct name and message', () => {
        const message = 'Test error message';
        const error = new C2gError(message);
        expect(error.name).toEqual('C2gError');
        expect(error.message).toEqual(message);
    });
    it('should set the process exit code', () => {
        const message = 'Test error message with exit code';
        const exitCode = 2;
        const error = new C2gError(message, exitCode);
        expect(error.name).toEqual('C2gError');
        expect(error.message).toEqual(message);
        expect(process.exitCode).toEqual(exitCode);
    });
});
//# sourceMappingURL=c2g-error.test.js.map