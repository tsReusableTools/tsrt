import asyncHooks from 'async_hooks';

import { isNil } from './objectUtils';

/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
declare global { export interface IRequestContext {} }

export class RequestContext<T extends GenericObject = IRequestContext> {
  private _storage = new Map<number, T>();

  constructor(initialContext?: T) {
    asyncHooks.createHook({ init: this.init.call(this), destroy: this.destroy.call(this) }).enable();
    if (initialContext) this.set(initialContext);
  }

  public set<K extends keyof T>(value: Partial<T>): void;
  public set<K extends keyof T>(key: K, value: T[K]): void;
  public set<K extends keyof T>(key: K | Partial<T>, value?: T[K]): void {
    const executionAsyncId = asyncHooks.executionAsyncId();
    const storage = this._storage.get(executionAsyncId);
    if (typeof key === 'string') this._storage.set(executionAsyncId, { ...storage, [key]: value });
    else if (typeof key === 'object') this._storage.set(executionAsyncId, { ...storage, ...key });
  }

  public get(): T;
  public get<K extends keyof T>(key: K): T[K];
  public get<K extends keyof T>(key?: K): T | T[K] {
    const executionAsyncId = asyncHooks.executionAsyncId();
    const storage = this._storage.get(executionAsyncId);
    return !isNil(key) && storage ? storage[key] : storage;
  }

  private init(asyncId: number, _type: string, triggerAsyncId: number): void {
    if (this._storage.has(triggerAsyncId)) this._storage.set(asyncId, this._storage.get(triggerAsyncId));
  }

  private destroy(asyncId: number): void {
    if (this._storage.has(asyncId)) this._storage.delete(asyncId);
  }
}

export const requestContext = new RequestContext();
