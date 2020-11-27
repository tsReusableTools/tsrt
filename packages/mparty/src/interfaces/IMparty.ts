import { IncomingMessage } from 'http';

import { IAdapter, IFileMetadata } from './IAdapter';
import { IMpartyLimits } from './IMpartyLimits';

export interface IMpartyOptions<T extends IFileMetadata = IFileMetadata, Req extends IncomingMessage = IncomingMessage> {
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
  limits?: IMpartyLimits;
}

/* eslint-disable-next-line */
export interface IMpartyUploadOptions<T extends IFileMetadata = IFileMetadata, Req extends IncomingMessage = IncomingMessage> extends IMpartyOptions<T> {
  //
}

export type FilesFilter<T extends IFileMetadata = IFileMetadata, Req extends IncomingMessage = IncomingMessage> = (
  req: Req, file: NodeJS.ReadableStream, fileMetadata: T
) => Promise<boolean> | boolean;

export type FileNameFactory<T extends IFileMetadata = IFileMetadata, Req extends IncomingMessage = IncomingMessage> = (
  req: Req, file: NodeJS.ReadableStream, fileMetadata: Omit<T, 'fileName'>
) => Promise<string> | string;
