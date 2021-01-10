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
import { defaultSettings } from './utils/defaultSettings';
import { patchValidatorsWithoutGroups } from './utils/patchValidatorsWithoutGroups';
import './pipes';

@Configuration(defaultSettings as Configuration)
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: IApplicationSettings;
  private _app: Application;

  public $beforeInit(): void {
    /* eslint-disable-next-line */
    this._app = new Application(this.convertMapToObject(this.settings as any), this.app.raw);
    this.initializeSettingsDependentOptions(this.settings);
    this.setDefaultSwagger(this._app.settings);
    this.setDefaultMount(this._app.settings);
    this._app.manualSetup({ useMethodsByDefault: false }).setupQueryParser();
  }

  public $beforeRoutesInit(): void {
    this._app
      .manualSetup({ useMethodsByDefault: false })
      .setupDefaultExpressMiddlewares()
      .setupRequestIdMiddleware()
      .setupSession()
      .setupStatics()
      .setupMiddlewares();
  }

  public $afterRoutesInit(): void {
    this._app
      .manualSetup({ useMethodsByDefault: false })
      .setupNotFoundHandler()
      .setupWebApps()
      .setupGlobalErrorHandler();
  }

  public $beforeListen(): void {
    if (this.settings.patchValidatorsWithoutGroups) patchValidatorsWithoutGroups();
  }

  /* eslint-disable-next-line */
  // private get _settings(): Map<string, any> {
  //   /* eslint-disable-next-line */
  //   return this.settings as any;
  // }

  private initializeSettingsDependentOptions(settings: IApplicationSettings): void {
    if (!this.settings.notFoundHandler) this._app.setNotFoundHandler(createNotFoundHandler(settings?.log));
    if (!this.settings.globalErrorHandler) this._app.setGlobalErrorHandler(createGlobalErrorHandler(settings?.log));
  }

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
