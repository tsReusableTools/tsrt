import { Request } from 'express';
import { Socket } from 'net';

import { IAdapter, FsAdapter, IMpartyOptions } from '@tsrt/mparty';

import { IMpartyMiddlewareOptions } from './types';

/* eslint-disable-next-line */
export function throwErrorIfMiddlewareIsNotCalled(target: any): void {
  if ((target as Request).socket instanceof Socket) {
    throw new Error('Please, call middleware as function. Example: mpartyMiddleware().');
  }
}

export async function getMpartyOptions(req: Request, options: IMpartyMiddlewareOptions): Promise<IMpartyOptions> {
  const { adapter: adapterOrFunct, destination: destOrFunc } = options;
  let adapter: IAdapter;

  if (adapterOrFunct) {
    adapter = typeof adapterOrFunct === 'function' ? await adapterOrFunct(req) : adapterOrFunct;
  }

  if (!adapter) {
    const destination = typeof destOrFunc === 'string' ? destOrFunc : await destOrFunc(req);
    adapter = new FsAdapter({ destination });
  }

  const result = { ...options } as IMpartyOptions;
  delete result.adapter;
  delete result.destination;
  result.adapter = adapter;

  return result;
}
