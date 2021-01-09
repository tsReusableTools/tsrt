import { PlatformApplication, EndpointDirectoriesSettings } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express';
import '@tsed/ajv';
import { SwaggerSettings } from '@tsed/swagger';

import { Application } from '@tsrt/application';

import { IApplicationSettings } from './interfaces';
import { HealthController } from './controllers/HealthController';
import { InfoController } from './controllers/InfoController';
import { createNotFoundHandler, createGlobalErrorHandler } from './middlewares';
import './pipes';

@Configuration({
  // mount: { '/api/v1': [HealthController, InfoController] },
  logger: { level: 'error' },
  httpsPort: false,
  routers: { mergeParams: true },
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
  setSwaggerForApiBaseByDefault: true,
})
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: IApplicationSettings;
  private _app: Application;

  public $beforeInit(): void {
    /* eslint-disable-next-line */
    this._app = new Application(this.convertMapToObject(this.settings as any), this.app.raw);
    if (!this.settings.notFoundHandler) this._app.setNotFoundHandler(createNotFoundHandler(this.settings?.log));
    if (!this.settings.globalErrorHandler) this._app.setGlobalErrorHandler(createGlobalErrorHandler(this.settings?.log));
    this.setDefaultSwagger(this._app.settings);
    this.setDefaultMount(this._app.settings);
    this._app.manualSetup().setupQueryParser();
  }

  public $beforeRoutesInit(): void {
    this._app
      .manualSetup()
      .setupDefaultExpressMiddlewares()
      .setupRequestIdMiddleware()
      .setupSession()
      .setupStatics()
      .setupMiddlewares();
  }

  public $afterRoutesInit(): void {
    this._app
      .manualSetup()
      .setupNotFoundHandler()
      .setupWebApps()
      .setupGlobalErrorHandler();
  }

  /* eslint-disable-next-line */
  // private get _settings(): Map<string, any> {
  //   /* eslint-disable-next-line */
  //   return this.settings as any;
  // }

  private setDefaultSwagger(settings: IApplicationSettings): void {
    if (!this.settings.setSwaggerForApiBaseByDefault || !settings.apiBase || typeof settings.apiBase !== 'string') return;
    const swagger: SwaggerSettings[] = [];
    swagger.push({ path: `${settings.apiBase}/api-docs` });
    if (!this.settings.swagger) this.settings.swagger = [];
    this.settings.swagger = (this.settings.swagger as SwaggerSettings[]).concat(swagger);
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
