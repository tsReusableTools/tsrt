import { EventEmitter } from 'events';

export class UploadQueue {
  private _filesToUpload = 0;
  private _hasError = false;
  private _event = new EventEmitter();

  public get hasError(): boolean { return this._hasError; }

  public get isDone(): boolean { return this._filesToUpload === 0; }

  public onError(cb: () => Promise<void>): void {
    if (this._hasError) return;
    this._hasError = true;
    if (this.isDone) cb();
    else this._event.once('done', cb);
  }

  public add(): void { this._filesToUpload++; }

  public remove(): void { if (--this._filesToUpload <= 0) this._event.emit('done', true); }
}
