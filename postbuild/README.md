# `./postbuild/` directory

This is a directory for a simple script `postbuild.mjs` whose sole purpose is to add the file extension .js in the respective import statements of all targeted strings in the .js files in the ./build/src folder and its subfolders.

The script will add file extensions to all local import statements:

```
import { foo } from './foo'
```

to

```
import { foo } from './foo.js'
```

This script is run together with `npx tsc` during the `npm run build` command.
