import { IncomingMessage } from 'http';

import { IMemoryAdapterFileMetadata, IFileMetadata, IAdapter, IUploadResult } from '../interfaces';

export class MemoryAdapter implements IAdapter<IMemoryAdapterFileMetadata, IncomingMessage> {
  public async onUpload(
    _req: IncomingMessage, file: NodeJS.ReadableStream, fileMetaData: IFileMetadata,
  ): Promise<IMemoryAdapterFileMetadata> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      file.on('end', () => {
        const buffer = Buffer.concat(chunks).toString();
        const size = buffer.length;
        resolve({ ...fileMetaData, size, buffer });
      });
      file.on('error', (err: Error) => { reject(err); });
    });
  }

  public async onRemove(_req: IncomingMessage, uploadedResult: IUploadResult<IMemoryAdapterFileMetadata>): Promise<void> {
    if (!uploadedResult.files?.length) return;
    /* eslint-disable-next-line no-param-reassign */
    uploadedResult.files.forEach((item) => { delete item.buffer; delete item.size; });
  }
}
