import { IncomingMessage } from 'http';

export interface IFileMetadata {
  fieldName: string;
  fileName: string;
  originalFileName: string;
  encoding: string;
  mimetype: string;
  extension: string;
}

export interface IUploadResult<T extends IFileMetadata> {
  fields: GenericObject;
  files: T[];
  file?: T;
}

export interface IAdapter<T extends IFileMetadata = IFileMetadata, Req extends IncomingMessage = IncomingMessage> {
  onUpload: (req: Req, file: NodeJS.ReadableStream, fileMetadata: IFileMetadata) => Promise<T>;
  onRemove: (req: Req, uploadedResult: IUploadResult<T>) => Promise<void>;
}
