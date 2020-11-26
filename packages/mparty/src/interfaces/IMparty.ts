// import { IncomingMessage } from 'http';

import { IAdapter, IFileMetadata } from './IAdapter';
import { IMpartyLimits } from './IMpartyLimits';

export interface IMpartyOptions<T extends IFileMetadata> {
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
  limits?: IMpartyLimits;
}

/* eslint-disable-next-line */
export interface IMpartyUploadOptions<T extends IFileMetadata> extends IMpartyOptions<T> {
  //
}
