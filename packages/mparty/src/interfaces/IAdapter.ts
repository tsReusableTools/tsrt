/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';

export type AdapterEvents = 'error' | 'finish';

export interface IFileMetadata extends GenericObject {
  fieldName: string;
  fileName: string;
  originalFileName: string;
  encoding: string;
  mimetype: string;
  extension: string;
}

export interface IAdapterUploadResult<T> {
  fields: GenericObject;
  files: T[];
  file?: T;
  errors?: Error[];
}

export interface IAdapterOptions {
  validate?: boolean;
}

export interface IAdapter extends EventEmitter {
  onError: (error: Error) => void;
  onFinish: () => void;
  onField: (fieldName: string, value: any) => void;
  onFileChunk: (data: string, fileName: string, fieldName: string, contentType: string) => Promise<void>;
  onFile: (file: NodeJS.ReadableStream, fileMetadata: IFileMetadata) => Promise<void>;
  // onValidationFailed()
}
