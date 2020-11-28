# Typescript Reusable Tools: Mparty Express Middleware

[![npm version](https://img.shields.io/npm/v/@tsrt/mparty-express.svg)](https://www.npmjs.com/package/@tsrt/mparty-express) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/mparty-express.svg)](https://www.npmjs.com/package/@tsrt/mparty-express) [![Downloads](https://img.shields.io/npm/dm/@tsrt/mparty-express.svg)](https://www.npmjs.com/package/@tsrt/mparty-express)

An [Mparty](https://www.npmjs.com/package/@tsrt/mparty) Express middleware.

Includes updated `Express Request` typings.

All available __[limits & options](https://www.npmjs.com/package/@tsrt/mparty#options)__ are available here.

## Usage

```ts
import { Router } from 'express';
import { createMpartyMiddleware } from '@tsrt/mparty-express';

const mpartyMiddleware = createMpartyMiddleware({ destination: 'some/files/path' });

const router = Router();

// Allow uploading any files
router.post('/upload1', mpartyMiddleware(), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

// Restrict uploading files only for next fields: `fileField1`, `fileField1`.
router.post('/upload2', mpartyMiddleware(['fileField1', 'fileField2']), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

// Provide some route specific limitations (same as above example)
router.post('/upload3', mpartyMiddleware({ limits: { allowedFiles: ['fileField1', 'fileField2'] } }), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

// Limit files amount
router.post('/upload4', mpartyMiddleware({ limits: { allowedFiles: ['fileField1'], files: 1 } }), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

// ... etc

export default router;

```

## Dynamic destionation config

```ts
import { Router, Request } from 'express';
import { createMpartyMiddleware } from '@tsrt/mparty-express';

async function destination(req: Request): Promise<string> {
  // ...make any async/sync calculations or get data from Request
  return `/some/${req.method}/path`;
}
const mpartyMiddleware = createMpartyMiddleware({ destination });

const router = Router();

// ... Same usage as from example above

export default router;
```

##### ... or  dynamic adapter. For example [AwsAdapter](https://www.npmjs.com/package/@tsrt/mparty-aws):

```ts
import { Router, Request } from 'express';
import { IAdapter } from '@tsrt/mparty';
import { createMpartyMiddleware } from '@tsrt/mparty-express';
import { AwsAdapter } from '@tsrt/mparty-aws';

import { SomeAwsConfigService } from '@lib/services';

async function adapter(req: Request): Promise<IAdapter> {
  const awsConfig = await SomeAwsConfigService.getConfigFromRequestContext(req);
  return new AwsAdapter(awsConfig);
}
const mpartyMiddleware = createMpartyMiddleware({ adapter });

const router = Router();

// ... Same usage as from example above

export default router;
```


### Use cases

Some options or default limits could be provided right here. The will be applied by default unless reassigned manually in specific route.

For example fileNameFactory:

```ts
import { Router } from 'express';
import { createMpartyMiddleware } from '@tsrt/mparty-express';

const fileNameFactory: FileNameFactory = async (req, _file, { originalFileName }) => `${req.method}/${Date.now()}_${originalFileName}`;

const mpartyMiddleware = createMpartyMiddleware({ destination: 'some/files/path', fileNameFactory });

export const router = Router();

// Use default options
router.post('/upload1', mpartyMiddleware(), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

// Reassign destionstion for this route specific
router.post('/upload1', mpartyMiddleware({ destionation: 'some/another/path' }), (req, res) => {
  console.log(req.files);
  console.log(req.file);
});

```

## Todo

- [ ] Update allowedFiles signature after [Mparty](https://www.npmjs.com/package/@tsrt/mparty) will implement it. The puspose is next: `upload(['file1', ['files', min, max], ['files', 1, 5]]) `

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
