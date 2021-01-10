import { PlatformExpress } from '@tsed/platform-express';
import { Configuration } from '@tsed/common';
import merge from 'deepmerge';
import isPlainObject from 'is-plain-obj';

import { Callback } from '@tsrt/application';

import { IApplicationSettings } from './interfaces';
import { patchBodyParamsDecorator } from './pipes/BodyParamsPipe';
import { defaultSettings } from './utils/defaultSettings';
import { Server } from './server';

export class Application {
  private _settings: IApplicationSettings = { ...defaultSettings };

  constructor(settings: IApplicationSettings) {
    this._settings = merge({ ...this._settings }, settings, { isMergeableObject: isPlainObject });
    this.applySettings();
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public async start(cb?: Callback): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    const server = await PlatformExpress.bootstrap(Server, this._settings as unknown as Configuration);
    await server.listen();
    if (cb) cb();
  }

  private applySettings(): void {
    if (this._settings.patchBodyParamsDecorator) patchBodyParamsDecorator();
  }
}
