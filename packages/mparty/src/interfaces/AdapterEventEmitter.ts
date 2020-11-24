/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';

import { AdapterEvents, IFileMetadata, IAdapterUploadResult } from './IAdapter';

export class AdapterEventEmitter<T extends IFileMetadata> extends EventEmitter {
  emit(event: 'error', data: Error): boolean;
  emit(event: 'finish', data: IAdapterUploadResult<T>): boolean;
  emit(event: AdapterEvents, ...args: any[]): boolean { return super.emit(event, ...args); }

  on(event: 'error', listener: (data: Error) => void): this;
  on(event: 'finish', listener: (data: IAdapterUploadResult<T>) => void): this;
  on(event: AdapterEvents, listener: (...args: any[]) => void): this { return super.on(event, listener); }
}
