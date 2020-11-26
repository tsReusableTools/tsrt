import fs from 'fs';
import { IncomingMessage } from 'http';

import { IFsAdapterFileMetadata, IFsAdapterOptions, IFileMetadata, IAdapter, IUploadResult } from '../interfaces';
import { MpartyError } from '../utils';

export class FsAdapter implements IAdapter<IFsAdapterFileMetadata, IncomingMessage> {
  constructor(protected readonly options: IFsAdapterOptions) {
    if (!options.destination) throw new MpartyError('INVALID_OPTIONS', 'FsAdapter requires a `destionation` property');
  }

  public async onUpload(
    _req: IncomingMessage, file: NodeJS.ReadableStream, { fileName, ...fileMetaData }: IFileMetadata,
  ): Promise<IFsAdapterFileMetadata> {
    return new Promise((resolve, reject) => {
      const { destination } = this.options;
      const path = `${destination}/${fileName}`;
      this.verifyDirExistance(destination);
      const writeStream = fs.createWriteStream(path);

      file.pipe(writeStream);

      writeStream.on('finish', () => resolve({ ...fileMetaData, fileName, destination, path, size: writeStream.bytesWritten }));
      writeStream.on('error', (err: Error) => reject(err));
    });
  }

  public async onRemove(_req: IncomingMessage, uploadedResult: IUploadResult<IFsAdapterFileMetadata>): Promise<void> {
    if (!uploadedResult.files?.length) return;
    uploadedResult.files.forEach((item) => { fs.unlinkSync(item.path); });
  }

  private verifyDirExistance(destination: string): void {
    if (!fs.existsSync(destination)) fs.mkdirSync(destination);
  }
}
