import 'reflect-metadata';

import { PlatformApplication, EndpointDirectoriesSettings } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express';
import '@tsed/ajv';
import '@tsed/swagger';

import { Application } from '@tsrt/application';

import { IApplicationSettings } from './interfaces';
import { HealthController } from './controllers/HealthController';
import { InfoController } from './controllers/InfoController';
import { GlobalErrorHandlerMiddleware } from './middlewares';
import './pipes';

@Configuration({
  rootDir: __dirname,
  commonServerDir: __dirname,
  // mount: { '/api/v1': [HealthController, InfoController] },
  logger: { level: 'error' },
  httpsPort: false,
  routers: { mergeParams: true },
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
})
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: IApplicationSettings;
  private _app: Application;

  public $beforeInit(): void {
    /* eslint-disable-next-line */
    this._app = new Application(this.convertMapToObject(this.settings as any), this.app.raw);
    this.setDefaultSwagger(this._app.settings);
    this.setDefaultMount(this._app.settings);
    this._app.config.setQueryParser();
  }

  public $beforeRoutesInit(): void {
    this._app.config.setDefaultMiddlewares();
    // this._app.config.setSendResponseMiddleware((regExpExcludedStrings('/api-docs')));
    this._app.config.setRequestIdMiddleware();
    this._app.config.setSession();
    this._app.config.setStatics();
    this._app.config.setMiddlewares();
  }

  public $afterRoutesInit(): void {
    this._app.config.setNotFoundHandler();
    this._app.config.setWebApps();
    this.app.use(GlobalErrorHandlerMiddleware);
  }

  private setDefaultSwagger(settings: IApplicationSettings): void {
    if (!settings.apiBase) return;
    const swagger = [];
    if (typeof settings.apiBase === 'string') swagger.push({ path: `${settings.apiBase}/api-docs` });
    else settings.apiBase.forEach((item) => swagger.push({ path: `${item}/api-docs` }));
    if (!this.settings.swagger) this.settings.swagger = [];
    this.settings.swagger = this.settings.swagger.concat(swagger);
  }

  private setDefaultMount(settings: IApplicationSettings): void {
    if (!settings.apiBase || !settings.useDefaultControllers) return;
    if (typeof settings.apiBase === 'string') this.mergeMount({ [settings.apiBase]: [InfoController, HealthController] });
    else settings.apiBase.forEach((path) => this.mergeMount({ [path]: [InfoController, HealthController] }));
  }

  private mergeMount(mount: EndpointDirectoriesSettings): void {
    if (!this.settings.mount) this.settings.mount = {};
    const result = this.settings.mount;
    Object.entries(mount).forEach(([key, value]) => {
      const routes = Array.isArray(value) ? value : [value];
      const existingMount = Array.isArray(result[key]) ? result[key] : [result[key]] as EndpointDirectoriesSettings;
      if (!result[key]) result[key] = routes;
      else result[key] = existingMount.concat(routes);
    });
    this.settings.mount = result;
  }

  /* eslint-disable-next-line */
  private convertMapToObject(map: Map<string, any>): IApplicationSettings {
    const result: IApplicationSettings = { };
    map.forEach((value, key) => { result[key] = value; });
    return result;
  }
}
