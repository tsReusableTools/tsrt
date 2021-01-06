import { PlatformExpress } from '@tsed/platform-express';
import { Configuration } from '@tsed/common';
import { deepMerge } from '@tsed/core';

import { IApplicationSettings } from './interfaces';
import { Server } from './server';

export class Application {
  private _settings: IApplicationSettings = { };

  constructor(settings: IApplicationSettings) {
    this._settings = deepMerge({ ...settings }, { ...this._settings });
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public async start(cb?: (...args: any[]) => void): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    console.log('this._settings >>>', this._settings);
    const server = await PlatformExpress.bootstrap(Server, this._settings as unknown as Configuration);
    await server.listen();
    if (cb) cb();
  }
}
