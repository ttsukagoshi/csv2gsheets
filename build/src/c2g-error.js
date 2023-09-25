export class C2gError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
        this.name = C2gError.name;
        process.exitCode = exitCode;
    }
}
//# sourceMappingURL=c2g-error.js.map