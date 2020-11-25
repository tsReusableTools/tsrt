/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';

export type AdapterEvents = 'error' | 'finish' | 'uploaded';

export interface IFileMetadata extends GenericObject {
  fieldName: string;
  fileName: string;
  originalFileName: string;
  encoding: string;
  mimetype: string;
  extension: string;
}

export interface IAdapterUploadResult<T extends IFileMetadata> {
  fields: GenericObject;
  files: T[];
  file?: T;
  // errors?: Error[];
}

export interface IAdapterOptions {
  validate?: boolean;
}

export interface IAdapter<T extends IFileMetadata> extends EventEmitter {
  onError: (error: Error) => void;
  onFinish: () => void;
  onField: (fieldName: string, value: any) => void;
  onFile: (file: NodeJS.ReadableStream, fileMetadata: IFileMetadata) => Promise<void>;
  onRemoveUploadedFiles: (uploadedResult: IAdapterUploadResult<T>) => Promise<void>;
}
