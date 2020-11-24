import { IAdapter } from './IAdapter';
import { IMpartyLimits } from './IMpartyValidator';

export interface IMpartyOptions {
  /** Adapter to be used for file upload */
  adapter?: IAdapter;

  /** If no adapter provided and provided a destionation - FsAdapter will be used for provided destionation */
  destination?: string;

  /** Whether to throw an error on requests with application/json Content-Type. Default: false  */
  shouldFailOnJson?: boolean;

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
export interface IMpartyUploadOptions extends IMpartyOptions {
  //
}
