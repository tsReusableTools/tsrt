/* eslint-disable import/no-extraneous-dependencies */
import { Readable } from 'stream';
import { EventEmitter } from 'events';

import { Request } from 'express';
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { Part, FormOptions } from 'multiparty';

import { IRequestValidatorPolicy } from './IRequestValidator';

/** Interface for StreamService AWS S3 configuration */
export interface IStreamServiceS3Config {
  bucketName: string;
  bucketSubDir: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/** Interface for StreamService configuration */
export interface IStreamServiceConfig {
  s3Config: IStreamServiceS3Config;
}

/** Interface for download method response */
export interface IStreamServiceDownloadResponse {
  stream(): Readable;
  data(): IMsgPromise;
}

/** Interface for target server upload response */
export interface IStreamServiceTargetServerUploadResponse {
  original: ManagedUpload;
  abort: () => void;
}

/** Interface for default file upload response */
export interface IStreamServiceUploadFileResponse {
  fieldName: string;
  fileName: string;
  contentType: string;
  mediaType: string;
  extension: string;
}

/** Interface for uploadStream AWS response */
export interface IStreamServiceAWSResponse extends IStreamServiceUploadFileResponse {
  s3Path: string;
  s3ETag: string;
  s3Bucket: string;
  s3Key: string;
  s3VersionId?: string;
}

/** Interface for uploadStream method response */
export interface IStreamServiceUploadStreamResponse<
  R extends IStreamServiceUploadFileResponse = IStreamServiceUploadFileResponse,
  T extends GenericObject = GenericObject,
> {
  value: R[];
  errors: Error[];
  fields?: T;
}

/** Interface for createUploadStream method options */
export interface IStreamServiceUploadStreamConfig {
  options?: FormOptions;
  acl?: S3.ObjectCannedACL;
  manualUpload?: boolean;
  validationPolicy?: IRequestValidatorPolicy;
}

/** Type for FileUpload class events */
export type StreamServiceUploadStreamEvents = 'done'
| 'transferProgress'
| 'AWSProgress'
| 'error'
| 'abort'
| 'part'
| 'field'
| 'completedRequestParse';

/** Interface for transfer progress object */
export interface IStreamServiceUploadStreamTransferProgress {
  received: number;
  expected: number;
  percentage: number;
}

/** Interface upload handler */
export type IStreamServiceUploadHandler = (prop: 'value' | 'errors', data: GenericAny) => void

/** FileUploadStream class which extends EventEmitter and provides appropriate type signatures */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class StreamServiceUploadStream<
  R extends IStreamServiceUploadFileResponse = IStreamServiceUploadFileResponse,
  T extends GenericObject = GenericObject,
> extends EventEmitter {
  emit(event: 'error', data: IMsg<string>): boolean;
  emit(event: 'abort'): boolean;
  emit(event: 'part', data: Part, uploadHandler: IStreamServiceUploadHandler): boolean;
  emit(event: 'field', name: string, value: string | number | boolean): boolean;
  emit(event: 'transferProgress', data: IStreamServiceUploadStreamTransferProgress): boolean;
  emit(event: 'AWSProgress', data: ManagedUpload.Progress): boolean;
  emit(event: 'done', data: IStreamServiceUploadStreamResponse<R, T>): boolean;
  emit(event: StreamServiceUploadStreamEvents, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: 'error', listener: (data: IMsg<string>) => void): this;
  on(event: 'abort', listener: () => void): this;
  on(event: 'part', listener: (data: Part, uploadHandler: IStreamServiceUploadHandler) => void): this;
  on(event: 'field', listener: (name: string, value: string | number | boolean) => void): this;
  on(
    event: 'transferProgress', listener: (data: IStreamServiceUploadStreamTransferProgress) => void,
  ): this;
  on(event: 'AWSProgress', listener: (data: ManagedUpload.Progress) => void): this;
  on(event: 'done', listener: (data: IStreamServiceUploadStreamResponse<R, T>) => void): this;
  on(event: StreamServiceUploadStreamEvents, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Interface for StreamService */
export interface IStreamService {
  /**
   *  Creates upload stream directly to AWS S3
   *
   *  @param req - Express request stream
   *  @param [config] - Config for service method:
   *  multiparty config options, AWS ACL, AWS upload flag
   *
   *  @returns EventEmitter with necessary events
   */
  createUploadStream<
    R extends IStreamServiceUploadFileResponse = IStreamServiceUploadFileResponse,
    T extends GenericObject = GenericObject,
  >(
    req: Request, options?: IStreamServiceUploadStreamConfig,
  ): StreamServiceUploadStream<R, T>;

  /**
   *  Gets data from AWS S3 bucket
   *
   *  @param Key - Name of file to get
   */
  downloadFromS3(Key: string): IStreamServiceDownloadResponse;

  /**
   *  Deletes data from AWS S3 bucket
   *
   *  @param Key - Name of file to get
   */
  deleteFromS3(Key: string): IStreamServiceDownloadResponse;

  /**
   *  Uploads stream to AWS S3 server
   *
   *  @param fileUpload - FileService upload stream
   *  @param uploadHandler - FileService upload stream handler for each finished stream upload
   *  @param part - FileService upload stream part (chunk)
   *  @param [isPrivate] - isPrivate field, necessary specifically for our logic
   *  @param [ACL] - AWS S3 permissions for file
   */
  AWSUpload(
    fileUpload: StreamServiceUploadStream, uploadHandler: IStreamServiceUploadHandler, part: Part,
    ACL?: S3.ObjectCannedACL,
  ): IStreamServiceTargetServerUploadResponse;
}
