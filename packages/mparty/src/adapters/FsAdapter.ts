import fs from 'fs';
import { Adapter } from './Adapter';
import { IFsAdapterFileMetadata, IFsAdapterOptions, IFileMetadata, IAdapter, IAdapterUploadResult } from '../interfaces';
import { MpartyError, ERRORS } from '../utils';

export class FsAdapter extends Adapter<IFsAdapterFileMetadata> implements IAdapter<IFsAdapterFileMetadata> {
  constructor(protected readonly options: IFsAdapterOptions) {
    super(options);
    if (!options.destination) throw new MpartyError('FsAdapter requires a `destionation` property', ERRORS.INVALID_OPTIONS);
  }

  /* eslint-disable-next-line */
  public async onFile(file: NodeJS.ReadableStream, { fieldName, fileName, originalFileName, encoding, mimetype, extension }: IFileMetadata): Promise<void> {
    this.startFileUpload();

    const { destination } = this.options;
    const path = `${destination}/${fileName}`;
    this.verifyDirExistance(destination);
    const writeStream = fs.createWriteStream(path);

    file.pipe(writeStream);

    writeStream.on('finish', () => {
      const { bytesWritten: size } = writeStream;
      this.adapterUploadResult.files.push({
        fieldName, fileName, originalFileName, encoding, mimetype, extension, destination, path, size,
      });
      this.finishFileUpload();
    });

    writeStream.on('error', (err: Error) => { this.emit('error', err, this.adapterUploadResult); });
  }

  public async onRemoveUploadedFiles(uploadedResult: IAdapterUploadResult<IFsAdapterFileMetadata>): Promise<void> {
    if (!uploadedResult.files?.length) return;
    uploadedResult.files.forEach((item) => { fs.unlinkSync(item.path); });
  }

  private verifyDirExistance(destination: string): void {
    if (!fs.existsSync(destination)) fs.mkdirSync(destination);
  }
}
