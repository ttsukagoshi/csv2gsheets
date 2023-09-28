// Read package info

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readPackageUpSync } from 'read-pkg-up';

// Package Info
const __dirname: string = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_JSON =
  readPackageUpSync({ cwd: __dirname })?.packageJson ?? undefined;
