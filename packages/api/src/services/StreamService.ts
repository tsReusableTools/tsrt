// /* eslint-disable import/no-extraneous-dependencies */
// import { Readable } from 'stream';
//
// import { S3 } from 'aws-sdk';
// import { IncomingMessage } from 'http';
// import { Form, Part } from 'multiparty';
//
// import { msg, singleton, parseTypes, log } from '@tsu/utils';
//
// import {
//   IStreamService, IStreamServiceDownloadResponse,
//   IStreamServiceUploadStreamResponse, StreamServiceUploadStream,
//   IStreamServiceUploadHandler, IStreamServiceUploadStreamConfig,
//   IStreamServiceTargetServerUploadResponse, IStreamServiceUploadFileResponse,
//   IStreamServiceAWSResponse, IStreamServiceConfig,
// } from '../types';
// import { RequestValidator } from './RequestValidator';
//
// class StreamServiceSingleton implements IStreamService {
//   private _s3Connections: { [x: string]: S3 } = {};
//   private _config: IStreamServiceConfig;
//
//   /**
//    *  Initiates service, in order to receive context
//    *
//    *  @param config - context service, which holds tenant config or default config with AWS S3 configuration
//    */
//   public init(config: IStreamServiceConfig): void {
//     this._config = config;
//   }
//
//   /**
//    *  Creates upload stream directly to AWS S3
//    *
//    *  @param req - Express request stream
//    *  @param [customConfig] - Config for service method:
//    *  multiparty config options, AWS ACL, AWSupload flag
//    *
//    *  @returns EventEmitter with necessary events
//    */
//   public createUploadStream<
//     R extends IStreamServiceUploadFileResponse = IStreamServiceUploadFileResponse,
//     T extends GenericObject = GenericObject,
//   >(
//     req: IncomingMessage, customConfig?: IStreamServiceUploadStreamConfig,
//   ): StreamServiceUploadStream<R, T> {
//     const config: IStreamServiceUploadStreamConfig = {
//       manualUpload: false,
//       acl: 'public-read',
//       ...customConfig,
//     };
//     const fileUpload = new StreamServiceUploadStream<R, T>();
//     let defaultUpload: IStreamServiceTargetServerUploadResponse;
//     let filesAmount = 0;
//
//     if (!this.getConnection()) {
//       fileUpload.emit('error', msg.badRequest('No tenant found'));
//       return;
//     }
//
//     const response: IStreamServiceUploadStreamResponse<R, T> = { value: [], errors: [], fields: { } as T };
//     const form = new Form(config.options);
//     let counter = 0;
//
//     const uploadHandler: IStreamServiceUploadHandler = (prop, data) => {
//       counter--;
//
//       if (prop === 'value') {
//         response.value.push(data as R);
//       } else if (prop === 'errors') {
//         response.errors.push(data as Error);
//         fileUpload.emit('error', msg.badGateway(RequestValidator.errors.default) as IMsg);
//       }
//
//       if (!counter) {
//         const passed = RequestValidator.validateRequiredFilesFields<R>(
//           response.value, config.validationPolicy.requiredFilesFields,
//         );
//
//         if (!passed) {
//           response.value.forEach((item) => {
//             if ('s3Key' in item && (item as GenericObject).s3Key) {
//               this.deleteFromS3((item as GenericObject).s3Key).stream();
//             }
//           });
//
//           fileUpload.emit('error', msg.badRequest(
//             RequestValidator.provideError(RequestValidator.errors.requiredFilesFields, config.validationPolicy.requiredFilesFields),
//           ));
//           return;
//         }
//
//         fileUpload.emit('done', response);
//       } else if (!counter) {
//         fileUpload.emit('error', msg.badGateway(response) as IMsg);
//       }
//     };
//
//     form.parse(req);
//
//     form.on('error', (err) => {
//       if (err.message === 'Request aborted') {
//         fileUpload.emit('error', msg.note(204, err.message));
//         if (defaultUpload) defaultUpload.abort();
//         return;
//       }
//
//       if (err.message === 'unsupported content-type') {
//         return fileUpload.emit('error', msg.note(415, err.message));
//       }
//
//       // In this case there is just no files provided for upload
//       if (err.message !== 'stream ended unexpectedly') {
//         return fileUpload.emit('error', msg.badGateway(err.message));
//       }
//
//       fileUpload.emit('done', response);
//     });
//
//     form.on('progress', (received, expected) => {
//       const percentage = Math.round((received / expected) * 100);
//
//       fileUpload.emit('transferProgress', { received, expected, percentage });
//     });
//
//     form.on('field', (name, value) => {
//       let parsedValue = parseTypes(value);
//       if (typeof parsedValue === 'string' && !parsedValue.trim()) return;
//
//       try {
//         parsedValue = JSON.parse(parsedValue);
//         (response.fields as GenericObject)[name] = parsedValue;
//       } catch (err) {
//         (response.fields as GenericObject)[name] = parsedValue;
//       }
//
//       fileUpload.emit('field', name, parsedValue);
//     });
//
//     form.on('part', (part) => {
//       filesAmount++;
//
//       if (!part.filename) {
//         fileUpload.emit('done', response);
//         return;
//       }
//
//       const passed = RequestValidator.validate(config.validationPolicy, response.fields, filesAmount, part);
//       if (passed.status >= 400) {
//         fileUpload.emit('error', msg.note(passed.status, passed.data));
//         return;
//       }
//
//       counter++;
//
//       fileUpload.emit('part', part, uploadHandler);
//
//       if (!config.manualUpload) {
//         defaultUpload = this.AWSUpload(fileUpload, uploadHandler, part, config.acl);
//       }
//     });
//
//     form.on('close', () => {
//       if (counter) return;
//
//       // Run text fields validation if no files
//       const validatedFields = RequestValidator.validate(config.validationPolicy, response.fields);
//       if (validatedFields.status >= 400) {
//         fileUpload.emit('error', msg.note(validatedFields.status, validatedFields.data));
//         return;
//       }
//
//       // Run required files fields validation if no files
//       const validatedFiles = RequestValidator.validateRequiredFilesFields<R>(
//         response.value, config.validationPolicy.requiredFilesFields,
//       );
//       if (!validatedFiles) {
//         fileUpload.emit('error', msg.badRequest(
//           RequestValidator.provideError(RequestValidator.errors.requiredFilesFields, config.validationPolicy.requiredFilesFields),
//         ));
//         return;
//       }
//
//       fileUpload.emit('done', response);
//     });
//
//     return fileUpload;
//   }
//
//   /**
//    *  Gets data from AWS S3 bucket
//    *
//    *  @param Key - Name of file to get
//    */
//   public downloadFromS3(Key: string): IStreamServiceDownloadResponse {
//     const { s3, config } = this.getConnection();
//     if (!config) return;
//
//     const data = s3.getObject({ Key, Bucket: config.s3Config.bucketName });
//
//     return {
//       stream(): Readable { return data.createReadStream(); },
//       data(): IMsgPromise {
//         return data
//           .promise()
//           .then((res) => msg.ok(res))
//           .catch((err) => msg.badGateway(err));
//       },
//     };
//   }
//
//   /**
//    *  Updates already existing object in AWS S3 bucket - updates its ACL
//    *
//    *  @param Key - Name of file to get
//    */
//   public updateAclInS3(Key: string, ACL: S3.ObjectCannedACL): IStreamServiceDownloadResponse {
//     const { s3, config } = this.getConnection();
//     if (!config) return;
//
//     // const data = s3.getObject({ Key, Bucket: config.bucketName });
//     const data = s3.putObjectAcl({ Key, ACL, Bucket: config.s3Config.bucketName });
//
//     return {
//       stream(): Readable { return data.createReadStream(); },
//       data(): IMsgPromise {
//         return data
//           .promise()
//           .then((res) => msg.ok(res))
//           .catch((err) => msg.badGateway(err));
//       },
//     };
//   }
//
//   /**
//    *  Deletes data from AWS S3 bucket
//    *
//    *  @param Key - Name of file to get
//    */
//   public deleteFromS3(Key: string): IStreamServiceDownloadResponse {
//     const { s3, config } = this.getConnection();
//     if (!config) return;
//
//     const data = s3.deleteObject({ Key, Bucket: config.s3Config.bucketName });
//
//     return {
//       stream(): Readable { return data.createReadStream(); },
//       data(): IMsgPromise {
//         return data
//           .promise()
//           .then((res) => msg.ok(res))
//           .catch((err) => msg.badGateway(err));
//       },
//     };
//   }
//
//   /**
//    *  Uploads stream to AWS S3 bucket
//    *
//    *  @param stream - NodoJs.Readable / NodeJs.http.IncomingMessage stream
//    *  @param options - Options, necessary to add for stream data before sending to AWS
//    */
//   public async uploadToS3(
//     stream: Readable | IncomingMessage, options: {
//       fileName: string;
//       contentType?: string;
//       acl?: S3.ObjectCannedACL;
//       config?: IStreamServiceConfig;
//     },
//   ): IMsgPromise<IStreamServiceAWSResponse> {
//     try {
//       const { s3, config } = this.getConnection(options.config);
//
//       if (!config) return msg.internalServerError('Invalid config provided') as IMsg;
//
//       let contentType = 'application/octet-stream';
//       if (stream instanceof IncomingMessage) contentType = stream.headers['content-type'];
//       if (options.contentType) contentType = options.contentType;
//
//       const params: S3.PutObjectRequest = {
//         ACL: options.acl || 'public-read',
//         Bucket: config.s3Config.bucketName,
//         Body: stream,
//         Key: this.createFileName(options.fileName, config.s3Config.bucketSubDir),
//         ContentType: contentType,
//       };
//
//       return s3
//         .upload(params)
//         .promise()
//         .then((file) => msg.ok({
//           contentType,
//           fieldName: '',
//           fileName: options.fileName,
//           mediaType: contentType.split('/')[0],
//           extension: options.fileName.split('.')[options.fileName.split('.').length - 1],
//           s3Key: file.Key,
//           s3Path: file.Location,
//           s3VersionId: (file as GenericObject).VersionId,
//           s3Bucket: file.Bucket,
//           s3ETag: file.ETag,
//         }))
//         .catch((err) => msg.badGateway(err));
//     } catch (err) {
//       return msg.internalServerError(err.message || err);
//     }
//   }
//
//   /**
//    *  Uploads stream to AWS S3 server
//    *
//    *  @param fileUpload - FileService upload stream
//    *  @param uploadHandler - FileService upload stream hadler for each finished stream upload
//    *  @param part - FileService upload stream part (chunk)
//    *  @param [ACL] - AWS S3 permissions for file
//    */
//   public AWSUpload(
//     fileUpload: StreamServiceUploadStream, uploadHandler: IStreamServiceUploadHandler, part: Part,
//     ACL: S3.ObjectCannedACL = 'public-read',
//   ): IStreamServiceTargetServerUploadResponse {
//     const { s3, config } = this.getConnection();
//     if (!config || !s3) {
//       fileUpload.emit('error', msg.badRequest('No tenant found'));
//       return;
//     }
//
//     const params = {
//       ACL,
//       Bucket: config.s3Config.bucketName,
//       Body: part,
//       Key: this.createFileName(part.filename, config.s3Config.bucketSubDir),
//       ContentType: part.headers['content-type'],
//     };
//
//     const awsUpload = s3.upload(params, (err: Error) => {
//       log.error(err);
//     });
//
//     const abort = (): void => {
//       awsUpload.abort();
//       fileUpload.emit('abort');
//     };
//
//     awsUpload.on('httpUploadProgress', (progress) => {
//       fileUpload.emit('AWSProgress', progress);
//     });
//
//     awsUpload
//       .promise()
//       .then((data) => uploadHandler('value', {
//         fieldName: part.name,
//         fileName: part.filename,
//         contentType: part.headers['content-type'],
//         mediaType: part.headers['content-type'].split('/')[0],
//         extension: part.filename.split('.')[part.filename.split('.').length - 1],
//         s3Key: data.Key,
//         s3Path: data.Location,
//         s3VersionId: (data as GenericObject).VersionId,
//         s3Bucket: data.Bucket,
//         s3ETag: data.ETag,
//       }))
//       .catch((err) => {
//         log.error(err);
//         uploadHandler('errors', err);
//       });
//
//     return { abort, original: awsUpload };
//   }
//
//   /**
//    *  Creates file name before save in AWS S3
//    *
//    *  @param originalName - Modifies original file name (adding timestamp)
//    *  @param bucketSubDir - Bucket sub directory
//    */
//   private createFileName(originalName: string, bucketSubDir: string): string {
//     return `${bucketSubDir}/${Date.now().toString()}_${originalName}`;
//   }
//
//   /**
//    *  Gets correct connection (for current request context, if it is)
//    *
//    *  @param customConfig - Custom config to create AWS S3 connection
//    */
//   private getConnection(customConfig?: IStreamServiceConfig): { s3: S3; config: IStreamServiceConfig } {
//     if (customConfig) this.validateS3Config(customConfig);
//
//     const config = customConfig || this._config;
//
//     const { credentials } = config.s3Config;
//
//     const s3 = this._s3Connections[credentials.accessKeyId] || new S3({ credentials });
//     this._s3Connections[credentials.accessKeyId] = s3;
//
//     return { config, s3 };
//   }
//
//   /** Checks whether config is valid */
//   private validateS3Config(config: IStreamServiceConfig): void {
//     const { s3Config } = config;
//
//     if (
//       !s3Config || !s3Config.bucketName || !s3Config.bucketSubDir
//       || !s3Config.credentials || !s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey
//     ) {
//       throw new Error('Incorrect config provided');
//     }
//   }
// }
//
// /**
//  *  Manages file (files) upload / download into AWS S3.
//  *  It also provides API for uploading some file (files) and create record in DB
//  */
// export const StreamService = singleton(StreamServiceSingleton);
