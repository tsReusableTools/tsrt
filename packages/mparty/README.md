# Typescript Reusable Tools: Mparty

Mparty provides async/await API for handling `multipart/form-data` (in most cases for file uploading) using default or custom Adapter to store files (FileSystem, Memory, Aws or whatever is needed).
## Features

 - Ability to provide custom Adapter.
 - Async/await.
 - Typings.
 - Ability to use not only as middleware.
 - Framework independent.
 - Shipped w/ 2 default Adapters: FileSystem, Memory.
 - Customizable via options.
 - File validations (not only those Busboy provides).

## Plugins

 - AwsAdapter (soon `@tsrt/mparty-aws`).
 - Express Middleware (soon `@tsrt/mparty-express`).
 - _Maybe_ Google Drive Adapter (`@tsrt/mparty-gd`)

## Usage

For example in some controller (Here is used awesome [TsED](https://tsed.io/) Framework):
```ts
import { Mparty } from '@tsrt/mparty';

...

@Post('/')
public uploadFiles(@Request() req: Request) {
  try {
    const mparty = new Mparty({ destination: 'some/path' });
    const { fields, files, file } = mparty.upload(req); // `file` property will be available only if there were uploaded 1 file
    ...
  } catch (err) {
    ...
  }
}
```

Or in well known Express as middleware:
(__Note__, that there will be separate @tsrt/mparty-express package for some default middleware)
```ts
import { Request, Response, Next } from 'express';
import { Mparty, FsAdapter, MemoryAdapter, IFileMetadata } from '@tsrt/mparty';

export async function uploadMiddeware(req: Request, res: Response, next: Next): Promise<void> {
  try {
    const mparty = new Mparty({ destination: 'some/path' });
    const { fields, files, file } = mparty.upload(req); // `file` property will be available only if there were uploaded 1 file
    req.body = fields;
    req.files = files;
    req.file = file;
    ...
    next();
  } catch (err) {
    next(err);
  }
}

// Optionally update express typings if using Typescript
declare module 'express' {
  interface Request {
    files: IFileMetadata[];
    file?: IFileMetadata; // `file` property will be available only if there were uploaded 1 file
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    files: IFileMetadata[];
    file?: IFileMetadata; // `file` property will be available only if there were uploaded 1 file
  }
}

// And then
...
router.post('/', uploadMiddeware, (req, res) => {
  // req.files
  // req.file
});
```

## Use with default Adapters

```ts
import { Mparty, FsAdapter, MemoryAdapter, IFileMetadata } from '@tsrt/mparty';

const mparty = new Mparty({ destination: 'some/path' }); // If destination only provided the FsAdapter will be used by default.

// Or
const adapter = new FsAdapter({ destination: 'some/path' }) // const adapter = new MemoryAdapter()
const mparty = new Mparty({ adapter });
```

##### ... or create custom Adapter

```ts
import { IncomingMessage } from 'http'; // Or import { Request } from 'express or other compatible
import { IFileMetadata, IAdapter, IUploadResult } from '@tsrt/mparty';

interface IMyFile extends IFileMetadata {
  someProperty: string;
}

export class MyAdapter implements IAdapter<IMyFile, IncomingMessage> {
  public async onUpload(
    _req: IncomingMessage, file: NodeJS.ReadableStream,
    { fieldName, fileName, originalFileName, encoding, mimetype, extension }: IFileMetadata,
  ): Promise<IMyFile> {
    // ... logic for handling each file stream
    // Here you could use req, file stream and default file metadata
  }

  public async onRemove(_req: IncomingMessage, uploadedResult: IUploadResult<IMyFile>): Promise<void> {
    // ... logic for deleting uploaded files
    // Here you could use req and already uplaodedResult: { fields, files, file? } 
  }
}

// And then

const adapter = new MyAdapter();
const mparty = new Mparty({ adapter });
...

```

## Options

```ts
// Options
const options = {
  /** Adapter to be used for file upload */
  // adapter?: IAdapter<T> | ((req: IncomingMessage) => IAdapter<T>);
  adapter?: IAdapter<T>;

  /** If no adapter provided and provided a destionation - FsAdapter will be used for provided destionation */
  // destination?: string | ((req: IncomingMessage) => string);
  destination?: string;

  /** Whether to throw an error on requests with application/json Content-Type. Default: false  */
  failOnJson?: boolean;

  /** Whether to remove uploaded files from storage on Error occured. Default: true */
  removeOnError?: boolean;

  /**
   *  Busboy option. If paths in the multipart 'filename' field shall be preserved. (Default: false).
   *
   *  @see https://www.npmjs.com/package/busboy#busboy-methods
   */
  preservePath?: boolean;

  /**
   *  Busboy option. Various limits on incoming data
   *
   *  @see https://www.npmjs.com/package/busboy#busboy-methods
   */
  limits?: {
    // ===> Busboy validations:
    /** Max field name size (in bytes) (Default: 100 bytes). */
    fieldNameSize?: number;

    /** Max field value size (in bytes) (Default: 1MB). */
    fieldSize?: number;

    /** Max number of non-file fields (Default: Infinity). */
    fields?: number;

    /** For multipart forms, the max file size (in bytes) (Default: Infinity). */
    fileSize?: number;

    /** For multipart forms, the max number of file fields (Default: Infinity). */
    files?: number;

    /** For multipart forms, the max number of parts (fields + files) (Default: Infinity). */
    parts?: number;

    /** For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http). */
    headerPairs?: number;

    // ===> Additional multipart validations:
    /** Allowed files' extensions */
    extensions?: string[];

    /** Required files' fieldNames in form data */
    requiredFiles?: string[];

    /** Allowed files' fieldNames in form data */
    allowedFiles?: string[];
  };
}
```

### Disclaimer

This module initially was created due to the reason that there were no file-upload packages which provides convenient ability to stream files in a multi-tenant way into AWS S3.

The main purpose was to provide ability create custom Adapters w/ async save/remove interface and ability to use not only as middleware.

There were also added some useful validation utilities for files validation.

In first version it was based on [multiparty](https://www.npmjs.com/package/multiparty). Later on it was rewritten to use [busboy](https://www.npmjs.com/package/busboy) internally.

While struggling with error handling and adopting busboy for usage I discovered that awesome [multer](https://www.npmjs.com/package/multer) which I used sometimes previously provides ability to create [custom storage engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md) which indeed was what i really needed at the very beginnig of my path )

Still a lot of work was done, and there are some existing code which depends on this, so i decided to publish it.
