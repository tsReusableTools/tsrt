/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AdapterEventEmitter } from './AdapterEventEmitter';
import { IAdapter, IAdapterUploadResult, IAdapterFileMetadata, IAdapterFileToUpload, IAdapterOptions } from '../interfaces';
import { getFirstItem } from '../utils';

export abstract class Adapter<T extends IAdapterFileMetadata> extends AdapterEventEmitter<T> implements IAdapter {
  protected adapterUploadResult: IAdapterUploadResult<T> = { fields: {}, files: [], errors: [] };
  protected filesToUpload = 0;

  constructor(protected readonly options: IAdapterOptions) { super(); }

  public get isFinished(): boolean { return this.filesToUpload <= 0; }

  public onError(error: Error): void { this.emit('error', error); }

  public onFinish = (): void => { if (this.isFinished) this.finish(); };

  public onField(fieldName: string, value: any): void { this.adapterUploadResult.fields[fieldName] = value; }

  public async onFileChunk(_data: string, _fileName: string, _fieldName: string, _contentType: string): Promise<void> { }

  public async onFile(_fileMetadata: IAdapterFileToUpload): Promise<void> { this.startFileUpload(); }

  protected startFileUpload(): void {
    this.filesToUpload += 1;
  }

  protected finishFileUpload(): void {
    this.filesToUpload -= 1;
    if (this.isFinished) this.finish();
  }

  protected finish(): void {
    // this.adapterUploadResult.file = getFirstItem(this.adapterUploadResult.files);
    [this.adapterUploadResult.file] = this.adapterUploadResult.files;
    this.emit('finish', this.adapterUploadResult);
  }
}
