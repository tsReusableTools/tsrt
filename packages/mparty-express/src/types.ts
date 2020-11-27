/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/naming-convention */
import { RequestHandler, Request } from 'express';

import { IMpartyOptions, IFileMetadata, IAdapter } from '@tsrt/mparty';

export interface IMpartyMiddlewareOptions extends Omit<IMpartyOptions, 'adapter' | 'destination'> {
  adapter?: ((req?: Request) => Promise<IAdapter>) | IAdapter;

  destination?: ((req?: Request) => Promise<string>) | string;
}

export type MpartyMiddleware = {
  (limits?: IMpartyMiddlewareOptions): RequestHandler;
  (files: string[], limits?: IMpartyMiddlewareOptions): RequestHandler;
}

export interface RequestWithUploadedFiles {
  files?: Array<IFileMetadata & GenericObject>;
  file?: IFileMetadata & GenericObject;
}

declare module 'express' {
  interface Request extends RequestWithUploadedFiles { }
}

declare module 'express-serve-static-core' {
  interface Request extends RequestWithUploadedFiles { }
}
