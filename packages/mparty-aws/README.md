# Typescript Reusable Tools: Mparty AWS S3 Adapter

[![npm version](https://img.shields.io/npm/v/@tsrt/mparty-aws.svg)](https://www.npmjs.com/package/@tsrt/mparty-aws) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/mparty-aws.svg)](https://www.npmjs.com/package/@tsrt/mparty-aws) [![Downloads](https://img.shields.io/npm/dm/@tsrt/mparty-aws.svg)](https://www.npmjs.com/package/@tsrt/mparty-aws)

An [Mparty](https://www.npmjs.com/package/@tsrt/mparty) AWS S3 Adapter.

Internally uses [aws-sdk](https://www.npmjs.com/package/aws-sdk) for managing file uploading / deletion. Thus all `aws-sdk` __S3 config and upload config__ options are available for `AwsAdapter` as well.

## Usage

For example express middleware:
```ts
import { Request, Response, Next } from 'express';

export async function uploadMiddleware(req: Request, res: Response, next: Next): Promise<void> {
  try {
    const adapter = new AwsAdapter({
      config: { credentials: { accessKeyId: 'accessKeyId', secretAccessKey: 'secretAccessKey' } }, 
      uploadOptions: { Bucket: 'Bucket' },
    });

    const fileNameFactory: FileNameFactory = (_req, _file, { originalFileName }) => `tenantSubDir/${Date.now()}_${originalFileName}`;

    const mparty = new Mparty({ adapter, fileNameFactory });
    const { fields, files, file } = mparty.upload(req);

    req.body = fields;
    req.files = files;
    req.file = file;

    next();
  } catch (err) {
    next(err);
  }
}
```

##### ... or for multi-tenant system

Same example:

```ts
import { Request, Response, Next } from 'express';
import { SomeTenantService } from '@lib/services';

export async function uploadMiddleware(req: Request, res: Response, next: Next): Promise<void> {
  try {
    const { accessKeyId, secretAccessKey, Bucket, tenantSubDir } = await SomeTenantService.getTenantAwsConfigFromRequest(req);

    const adapter = new AwsAdapter({
      config: { credentials: { accessKeyId, secretAccessKey } }, 
      uploadOptions: { Bucket },
    });

    const fileNameFactory: FileNameFactory = (_req, _file, { originalFileName }) => `${tenantSubDir}/${Date.now()}_${originalFileName}`;

    const mparty = new Mparty({ adapter, fileNameFactory });
    const { fields, files, file } = mparty.upload(req);

    req.body = fields;
    req.files = files;
    req.file = file;

    next();
  } catch (err) {
    next(err);
  }
}
```

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
