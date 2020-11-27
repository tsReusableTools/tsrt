# Typescript Reusable Tools: Mparty AWS S3 Adapter

An [Mparty](https://www.npmjs.com/package/@tsrt/mparty) AWS S3 Adapter.

Internally uses [aws-sdk](https://www.npmjs.com/package/aws-sdk) for managing file uploading / deletion. Thus all `aws-sdk` options are available for `AwsAdapter`.

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
