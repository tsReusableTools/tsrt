import { PlatformExpress } from '@tsed/platform-express';
import { Configuration } from '@tsed/common';
import merge from 'deepmerge';
import isPlainObject from 'is-plain-obj';

import { Callback } from '@tsrt/application';

import { IApplicationSettings } from './interfaces';
import { Server } from './server';

export class Application {
  private _settings: IApplicationSettings = { };

  constructor(settings: IApplicationSettings) {
    this._settings = merge({ ...settings }, { ...this._settings }, { isMergeableObject: isPlainObject });
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public async start(cb?: Callback): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    const server = await PlatformExpress.bootstrap(Server, this._settings as unknown as Configuration);
    await server.listen();
    if (cb) cb();
  }
}
