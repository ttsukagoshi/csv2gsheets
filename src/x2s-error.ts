export class X2sError extends Error {
  constructor(message: string, exitCode = 1) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    this.name = X2sError.name;
    process.exitCode = exitCode;
  }
}
