/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AdapterEventEmitter } from '../interfaces/AdapterEventEmitter';
import { IAdapter, IAdapterUploadResult, IFileMetadata, IAdapterOptions } from '../interfaces';

export abstract class Adapter<T extends IFileMetadata> extends AdapterEventEmitter<T> implements IAdapter<T> {
  protected adapterUploadResult: IAdapterUploadResult<T> = { fields: {}, files: [] };
  protected filesToUpload = 0;
  protected hasError = false;

  constructor(protected readonly options: IAdapterOptions) { super(); }

  public get isFinished(): boolean { return this.filesToUpload <= 0; }

  public onError(error: Error): void {
    if (this.hasError) return;
    this.hasError = true;
    if (this.isFinished) this.emitError(error);
    else this.once('uploaded', () => this.emitError(error));
  }

  public onFinish(): void {
    if (this.hasError) return;
    if (this.isFinished) this.emitFinish();
    else this.once('uploaded', () => this.emitFinish());
  }

  public onField(fieldName: string, value: any): void { this.adapterUploadResult.fields[fieldName] = value; }

  protected startFileUpload(): void { this.filesToUpload += 1; }

  protected finishFileUpload(): void { if (--this.filesToUpload <= 0) this.emit('uploaded', this.adapterUploadResult); }

  protected emitError(error: Error): void { this.emit('error', error, this.adapterUploadResult); }

  protected emitFinish(): void {
    if (this.adapterUploadResult.files?.length === 1) [this.adapterUploadResult.file] = this.adapterUploadResult.files;
    this.emit('finish', this.adapterUploadResult);
  }

  public abstract async onFile(_file: NodeJS.ReadableStream, _fileMetadata: IFileMetadata): Promise<void>;

  public abstract async onRemoveUploadedFiles(uploadedResult: IAdapterUploadResult<T>): Promise<void>;
}
