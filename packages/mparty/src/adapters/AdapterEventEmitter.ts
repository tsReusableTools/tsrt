/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';

import { AdapterEventEmitterEvents, IAdapterFileMetadata, IAdapterUploadResult } from '../interfaces';

export class AdapterEventEmitter<T extends IAdapterFileMetadata> extends EventEmitter {
  emit(event: 'error', data: Error): boolean;
  emit(event: 'finish', data: IAdapterUploadResult<T>): boolean;
  emit(event: AdapterEventEmitterEvents, ...args: any[]): boolean { return super.emit(event, ...args); }

  on(event: 'error', listener: (data: Error) => void): this;
  on(event: 'finish', listener: (data: IAdapterUploadResult<T>) => void): this;
  on(event: AdapterEventEmitterEvents, listener: (...args: any[]) => void): this { return super.on(event, listener); }
}
