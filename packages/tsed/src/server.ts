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
// import { GlobalErrorHandlerMiddleware } from './middlewares';
import './pipes';

@Configuration({
  // rootDir: __dirname,
  httpsPort: false,
  // logger: { level: 'error' },
  routers: { mergeParams: true },
  ajv: {
    // coerceTypes: false,
    allErrors: true,
    // unknownFormats: ['binary'],
    formats: { binary: true },
  },
  // mount: { '/api/v1': [HealthController, InfoController] },
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
  setSwaggerForApiBaseByDefault: true,
})
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: IApplicationSettings;

  public $beforeInit(): void {
    const app = new Application(this.convertMapToObject(this._settings), this.app.rawApp);

    app.manualSetup().setupQueryParser();
    // console.log('this._settings iside >>>', this.settings);

    if (this.settings.setSwaggerForApiBaseByDefault) this.setDefaultSwagger(app.settings);
    this.setDefaultMount(app.settings);
  }

  public $beforeRoutesInit(): void {
    // this._app.manualSetup()
    new Application(this.convertMapToObject(this._settings), this.app.raw)
      .manualSetup()
      .setupDefaultExpressMiddlewares()
      // .setupSendResponseMiddleware((regExpExcludedStrings('/api-docs')))
      .setupRequestIdMiddleware()
      .setupSession()
      .setupStatics()
      .setupMiddlewares();
  }

  public $afterRoutesInit(): void {
    new Application(this.convertMapToObject(this._settings), this.app.raw)
      .manualSetup()
      .setupNotFoundHandler()
      .setupWebApps()
      .setupGlobalErrorHandler();
  }

  /* eslint-disable-next-line */
  private get _settings(): Map<string, any> {
    /* eslint-disable-next-line */
    return this.settings as any;
  }

  private setDefaultSwagger(settings: IApplicationSettings): void {
    if (!settings.apiBase) return;
    const swagger = [];
    const specVersion = '3.0.1';
    if (typeof settings.apiBase === 'string') swagger.push({ specVersion, path: `${settings.apiBase}/api-docs` });
    else settings.apiBase.forEach((item) => swagger.push({ specVersion, path: `${item}/api-docs` }));
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
