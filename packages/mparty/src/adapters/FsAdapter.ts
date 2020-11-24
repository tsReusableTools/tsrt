import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { Adapter } from './Adapter';
import { IFsAdapterFileMetadata, IFsAdapterOptions, IAdapterFileToUpload } from '../interfaces';

export class FsAdapter extends Adapter<IFsAdapterFileMetadata> {
  constructor(protected readonly options: IFsAdapterOptions) { super(options); }

  /* eslint-disable-next-line */
  public async onFile({ file, fieldName, fileName, originalFileName, encoding, mimetype, extension }: IAdapterFileToUpload): Promise<void> {
    await super.onFile({ file, fieldName, fileName, originalFileName, encoding, mimetype, extension });

    const { destination } = this.options;
    this.verifyDirExistance(destination);
    const writeStream = createWriteStream(`${destination}/${fileName}`);

    writeStream.on('close', () => {
      // this.adapterUploadResult.files[fieldName] = { fieldName, fileName, originalFileName, encoding, mimetype, extension, destination };
      this.adapterUploadResult.files.push({ fieldName, fileName, originalFileName, encoding, mimetype, extension, destination });
      this.finishFileUpload();
    });

    writeStream.on('error', (err: Error) => { this.emit('error', err); });

    file.pipe(writeStream);
  }

  private verifyDirExistance(destination: string): void {
    if (!existsSync(destination)) mkdirSync(destination);
  }
}
