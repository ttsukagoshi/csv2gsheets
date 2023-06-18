// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
import { readPackageUpSync } from 'read-pkg-up';

/**
 * Package Info
 */
// export const __dirname: string = dirname(fileURLToPath(import.meta.url));
const manifest = readPackageUpSync();
export const PACKAGE_JSON = manifest ? manifest.packageJson : undefined;
