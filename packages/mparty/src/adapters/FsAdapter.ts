import fs from 'fs';
import { Adapter } from './Adapter';
import { IFsAdapterFileMetadata, IFsAdapterOptions, IFileMetadata } from '../interfaces';
import { MpartyError, ERROR_CODES } from '../utils';

export class FsAdapter extends Adapter<IFsAdapterFileMetadata> {
  constructor(protected readonly options: IFsAdapterOptions) {
    super(options);
    if (!options.destination) throw new MpartyError('FsAdapter requires a `destionation` property', ERROR_CODES.INVALID_OPTIONS);
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

    writeStream.on('error', (err: Error) => { this.emit('error', err); });
  }

  private verifyDirExistance(destination: string): void {
    if (!fs.existsSync(destination)) fs.mkdirSync(destination);
  }
}
