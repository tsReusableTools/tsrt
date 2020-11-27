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
 - Easy and convenient usage for multi-tenant systems.

## Plugins

 - [x] AwsAdapter - [@tsrt/mparty-aws](https://www.npmjs.com/package/@tsrt/mparty-aws).
 - [x] Express Middleware - [@tsrt/mparty-express](https://www.npmjs.com/package/@tsrt/mparty-express).
 - [ ] _Maybe_ Google Drive Adapter (`@tsrt/mparty-gd`)

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
(__Note__, you can use [@tsrt/mparty-express](https://www.npmjs.com/package/@tsrt/mparty-express))
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

// It is also possible to provide options exactly to upload method
mparty.upload(req, { adapter, limits: { ... }, ... });
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
    req: IncomingMessage, file: NodeJS.ReadableStream,
    { fieldName, fileName, originalFileName, encoding, mimetype, extension }: IFileMetadata,
  ): Promise<IMyFile> {
    // ... logic for handling each file stream
    // Here you could use req, file stream and default file metadata
  }

  public async onRemove(req: IncomingMessage, uploadedResult: IUploadResult<IMyFile>): Promise<void> {
    // ... logic for deleting uploaded files
    // Here you could use req and already uplaodedResult: { fields, files, file? } 
  }
}

// And then

const adapter = new MyAdapter();
const mparty = new Mparty({ adapter });
...
```

##### ... or imagine multi-tenant system, where you need to decide which config to use for each and separate request:

(To simplify handling context in app i advise you consider using [express-http-context](https://www.npmjs.com/package/express-http-context) or [async_hooks](https://nodejs.org/api/async_hooks.html))

```ts
import { IncomingMessage } from 'http'; // Or import { Request } from 'express or other compatible
import { IFileMetadata, IAdapter, IUploadResult } from '@tsrt/mparty';

interface IMyFile extends IFileMetadata {
  someProperty: string;
}

interface IMyAdapterOptions {
  clientId: stirng;
  clientSecret: string;
  bucket: string;
}

/
export class MyAdapter implements IAdapter<IMyFile, IncomingMessage> {
  constructor(private options: IMyAdapterOptions)

  public async onUpload(req: IncomingMessage, file: NodeJS.ReadableStream, fileMetadata: IFileMetadata): Promise<IMyFile> {
    // upload(this.options);

    // Or using, for example, express-http-context: upload(requestContext.get('config'));
  }

  public async onRemove(req: IncomingMessage, uploadedResult: IUploadResult<IMyFile>): Promise<void> {
    // remove(this.options);
  }
}

...

// Later in your middeware
export async function mydMiddeware(req: Request, res: Response, next: Next): Promise<void> {
  try {
    const config: IMyAdapterOptions = await SomeService.getConfigByClinetIdFromRequest(req);
    const adapter = new MyAdapter({ config });
    const mparty = new Mparty({ adapter });
    const { fields, files, file } = mparty.upload(req);
    ...
    next();
  } catch (err) {
    next(err);
  }
}
```

## Options

```ts
// Options
const options = {
  /** Adapter to be used for file upload */
  adapter?: IAdapter<T>;

  /** If no adapter provided and provided a destionation - FsAdapter will be used for provided destionation */
  destination?: string;

  /**
   *  Files filter, which is called before each file upload.
   *  Here it is recommended to filter files is case of default Adapter usage
   *  (in case of custom adapter you can encapsulate it there)
   *
   *  Inspired by multer's @see https://www.npmjs.com/package/multer#filefilter. Thx guys, you are awesome.
   */
  filesFilter?: FilesFilter<T, Req>;

  /** Function for generating fileName for file. __Note__ that you re responsible for naming collisions */
  fileNameFactory?: FileNameFactory<T, Req>;

  /** Whether to throw an error on requests with application/json Content-Type. Default: false  */
  failOnJson?: boolean;

  /**
   *  Whether to remove uploaded files from storage on Error occured. Default: true.
   *  If `false` - already upload files metadata (before error occured) will be attached to MpartyError in `uploadedResult` field
   */
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
    /** Allowed files' extensions. Example: ['.png', '.pdf'] */
    extensions?: string[];

    /** Required files' fieldNames in form data */
    requiredFiles?: string[];

    /** Allowed files' fieldNames in form data */
    allowedFiles?: string[];
  };
}
```

## Todo

- [ ] Update allowedFiles signature to be as next: 
`upload(['file1', ['files', min, max], ['files', 1, 5]])`

### Disclaimer

This module initially was created due to the reason that i did not manage to found file-upload packages which provides convenient ability to stream files in a multi-tenant way into AWS S3.

The main purpose was to provide ability to create custom Adapters w/ async save/remove interface and ability to use it not only as middleware.

There were also added some useful validation utilities for files validation.

In first version it was based on [multiparty](https://www.npmjs.com/package/multiparty). Later on it was rewritten to use [busboy](https://www.npmjs.com/package/busboy) internally.

While struggling with error handling and adopting busboy for usage I discovered that awesome [multer](https://www.npmjs.com/package/multer) which I used sometimes previously provides ability to create [custom storage engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md) which indeed was what i really needed at the very beginnig of my path )

Still a lot of work was done, and there are some existing code which depends on this, so i decided to publish it.
