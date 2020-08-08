import 'reflect-metadata';
import { PlatformExpress } from '@tsed/platform-express';
import { IServerMountDirectories } from '@tsed/common';
import { deepMerge } from '@tsed/core';
import { ISwaggerSettings } from '@tsed/swagger';
// import '@tsed/swagger';
import '@tsed/ajv';

import { log } from '@tsd/utils';

import { DEFAULT_CONFIG } from '../utils/config';
import { BaseServer } from './server';
import { HealthController, InfoController } from './controllers';
import { IApplicationSettings } from '../lib/interfaces';

// import { ApiModule } from '../../../../../my-hub/core/server/src/module';

export class Application2 {
  private _settings: Partial<IApplicationSettings>;

  constructor(settings?: Partial<IApplicationSettings>) {
    this._settings = { ...DEFAULT_CONFIG, ...settings };
    console.log('this._settings 1234  >>>', this._settings);
    this.setDefaultCtrls();
    this.setDefaultSwagger();
  }

  public addWebApp(webApp: string | Record<string, string>): void {
    if (!webApp) return;

    if (!this._settings.webApp || typeof this._settings.webApp === 'string') this._settings.webApp = webApp;
    else if (typeof this._settings.webApp === 'object') {
      if (typeof webApp === 'string') this._settings.webApp['*'] = webApp;
      else this._settings.webApp = { ...this._settings.webApp, ...webApp };
    }
  }

  public addControllers(controllers: IServerMountDirectories): void {
    if (!controllers) return;
    this._settings.mount = deepMerge(this._settings.mount, controllers);
  }

  /* eslint-disable-next-line */
  public addModules(mod: any): void {
    if (!this._settings.imports) this._settings.imports = [];
    this._settings.imports.push(mod);
  }

  public async start(): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');

    try {
      console.log('start() with settings 123:', this._settings);
      const app = await PlatformExpress.bootstrap(BaseServer, this._settings);
      this.mountControllers(app);
      await app.listen();
      log.info(`Listen to port: ${this._settings.port}. Pid: ${process.pid}`);
    } catch (err) {
      log.error(err);
    }
  }

  private mountControllers(app: PlatformExpress): void {
    Object.entries(this._settings.mount).forEach(([key, value]) => { app.addControllers(key, value); });
  }

  private setDefaultSwagger(): void {
    if (this._settings.swagger) return;
    let { apiBase } = this._settings;
    if (!apiBase) apiBase = '/';

    const swagger: ISwaggerSettings[] = [];
    if (typeof apiBase === 'string') swagger.push({ path: this.getPath(apiBase, 'api-docs') });
    else if (apiBase && Array.isArray(apiBase)) apiBase.forEach((item) => { swagger.push({ path: this.getPath(item, 'api-docs') }); });
    this._settings.swagger = swagger;
  }

  private setDefaultCtrls(): void {
    let { apiBase } = this._settings;
    if (!apiBase) apiBase = '/';

    // const baseCtrls = [`${__dirname}/controllers/**/*.ts`];
    const baseCtrls = [HealthController, InfoController];
    const mount: IServerMountDirectories = { };
    if (typeof apiBase === 'string') mount[apiBase] = baseCtrls;
    else if (apiBase && Array.isArray(apiBase)) apiBase.forEach((item) => { mount[item] = baseCtrls; });
    this._settings.mount = deepMerge(this._settings.mount, mount);
  }

  private getPath(apiBase: string, defaultPath = ''): string {
    if (!apiBase) return apiBase;
    return `${apiBase && `${apiBase}/`}${defaultPath}`.replace(/\/{2,}/gi, '/').replace(/\/$/, '');
  }
}
