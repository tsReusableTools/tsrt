import { PlatformExpress } from '@tsed/platform-express';
import { Configuration } from '@tsed/common';
import { deepMerge } from '@tsed/core';

import { log } from '@tsd/logger';

import { IApplicationSettings } from './interfaces';
import { Server } from './server';

export class Application {
  private _settings: IApplicationSettings = { };

  constructor(settings: IApplicationSettings) {
    this._settings = deepMerge({ ...settings }, { ...this._settings });
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public async start(): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    const server = await PlatformExpress.bootstrap(Server, this._settings as Configuration);
    await server.listen();
    log.info(`Listen to port: ${this._settings.port}. Pid: ${process.pid}`);
  }
}
