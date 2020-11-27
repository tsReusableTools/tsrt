import { IncomingMessage } from 'http';
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';

import { IFileMetadata, IAdapter, IUploadResult } from '@tsrt/mparty';

export class AwsAdapter implements IAdapter<IAwsAdapterFileMetadata, IncomingMessage> {
  private s3: S3;

  constructor(protected readonly options: IAwsAdapterOptions) {
    this.s3 = new S3(options?.config);
  }

  public async onUpload(
    _req: IncomingMessage, Body: NodeJS.ReadableStream, { fileName, mimetype, ...fileMetaData }: IFileMetadata,
  ): Promise<IAwsAdapterFileMetadata> {
    const { ACL = 'public-read' } = this.options.uploadOptions;
    const params = { ...this.options.uploadOptions, ACL, Body, Key: fileName, ContentType: mimetype };
    const result = await this.s3.upload(params, this.options?.managedUploadOptions).promise();
    return { ...fileMetaData, fileName, mimetype, ...result };
  }

  public async onRemove(_req: IncomingMessage, uploadedResult: IUploadResult<IAwsAdapterFileMetadata>): Promise<void> {
    if (!uploadedResult.files?.length) return;
    const { Bucket } = this.options?.uploadOptions;
    const promises = uploadedResult.files.map(({ Key }) => this.s3.deleteObject({ Key, Bucket }).promise());
    await Promise.all(promises);
  }
}

export interface IAwsAdapterOptions {
  config: S3.ClientConfiguration;
  uploadOptions: Omit<S3.PutObjectRequest, 'Key'>;
  managedUploadOptions?: ManagedUpload.ManagedUploadOptions;
}

export interface IAwsAdapterFileMetadata extends IFileMetadata, ManagedUpload.SendData {
  VersionId?: string;
  key?: string;
}
