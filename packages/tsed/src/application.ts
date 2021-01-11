/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlatformExpress } from '@tsed/platform-express';
import { Configuration, EndpointDirectoriesSettings } from '@tsed/common';
import { SwaggerSettings } from '@tsed/swagger';
import merge from 'deepmerge';
import isPlainObject from 'is-plain-obj';

import { createLoggedSend } from '@tsrt/api-utils';

import {
  IApplicationSettings, IApplicationPrivateSettings, IApplicationSendResponseHandler,
  IApplicationManualSetup, Callback, IApplicationManualSetupSettings, IApplicationSession,
  ApplicationMiddlewareList, ApplicationWebApps, ApplicationMiddleware,
  ApplicationErrorMiddleware, ApplicationManuallyCalledMethod, IApplicationMethods,
} from './interfaces';
import { HealthController } from './controllers/HealthController';
import { InfoController } from './controllers/InfoController';
import { patchBodyParamsDecorator } from './pipes/BodyParamsPipe';
import { defaultSettings } from './utils/defaultSettings';
import { Server } from './server';

export class Application {
  private _settings: IApplicationPrivateSettings = { manuallyCalledMethodsOrder: [], ...defaultSettings };
  // private _useBeforeMethodsOrder: Partial<Record<keyof IApplicationMethods, ApplicationManuallyCalledMethod>> = { };
  private _useBeforeMethodsOrder: Array<[keyof IApplicationMethods, ApplicationManuallyCalledMethod]> = [];
  private _manualSetupSettings: IApplicationManualSetupSettings = { useMethodsByDefault: true };

  constructor(settings: IApplicationSettings) {
    this._settings = merge({ ...this._settings }, settings, { isMergeableObject: isPlainObject }) as IApplicationPrivateSettings;
    this.applySettings();
    this.setDefaultSwagger(this._settings);
    this.setDefaultMount(this._settings);
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public async start(cb?: Callback): Promise<void> {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    this.setupAll();
    this.insertUseBeforeMiddlewares();
    const server = await PlatformExpress.bootstrap(Server, this._settings as unknown as Configuration);
    await server.listen();
    if (cb) cb();
  }

  public manualSetup(settings?: IApplicationManualSetupSettings): IApplicationManualSetup {
    if (settings) this._manualSetupSettings = settings;
    return {
      set: this.set.bind(this),
      use: this.use.bind(this),
      useBefore: this.useBefore.bind(this),

      setupAll: this.setupAll.bind(this),
      setupQueryParser: this.setupQueryParser.bind(this),
      setupDefaultExpressMiddlewares: this.setupDefaultExpressMiddlewares.bind(this),
      setupRequestIdMiddleware: this.setupRequestIdMiddleware.bind(this),
      setupSession: this.setupSession.bind(this),
      setupSendResponseHandler: this.setupSendResponseHandler.bind(this),
      // setupStatics: this.setupStatics.bind(this),
      setupMiddlewares: this.setupMiddlewares.bind(this),
      setupNotFoundHandler: this.setupNotFoundHandler.bind(this),
      setupWebApps: this.setupWebApps.bind(this),
      setupGlobalErrorHandler: this.setupGlobalErrorHandler.bind(this),

      start: this.start.bind(this),
    };
  }

  protected setupAll(): IApplicationManualSetup {
    if (this._manualSetupSettings?.useMethodsByDefault === false) return this.manualSetup();
    const methods = [
      this.setupQueryParser,
      this.setupDefaultExpressMiddlewares,
      this.setupRequestIdMiddleware,
      this.setupSession,
      this.setupSendResponseHandler,
      // this.setupStatics,
      this.setupMiddlewares,
      this.setupNotFoundHandler,
      this.setupWebApps,
      this.setupGlobalErrorHandler,
    ];
    methods.forEach((item) => {
      const called = this._settings.manuallyCalledMethodsOrder.find((key) => key === item.name);
      if (!called) this._settings.manuallyCalledMethodsOrder.push(item.name as ApplicationManuallyCalledMethod);
    });

    return this.manualSetup();
  }

  protected set(setting: string, value: any): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(['set', setting, value]);
    return this.manualSetup();
  }

  protected use(...handlers: any[]): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(['use', ...handlers]);
    return this.manualSetup();
  }

  protected useBefore(methodName: keyof IApplicationMethods, ...handlers: any[]): IApplicationManualSetup {
    this._useBeforeMethodsOrder.push([methodName, ['use', ...handlers]]);
    return this.manualSetup();
  }

  /* eslint-disable-next-line */
  protected setupQueryParser(cb?: (str: string) => any): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupQueryParser.name);
    return this.manualSetup();
  }

  protected setupDefaultExpressMiddlewares(): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupDefaultExpressMiddlewares.name);
    return this.manualSetup();
  }

  protected setupRequestIdMiddleware(): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupRequestIdMiddleware.name);
    return this.manualSetup();
  }

  protected setupSession(sessionConfig: IApplicationSession = this._settings.session): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupSession.name);
    if (sessionConfig) this._settings.session = sessionConfig;
    return this.manualSetup();
  }

  protected setupSendResponseHandler(
    handler: IApplicationSendResponseHandler = this._settings.sendResponseHandler,
  ): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupSendResponseHandler.name);
    if (handler) this._settings.sendResponseHandler = handler;
    return this.manualSetup();
  }

  // protected setupStatics(statics: ApplicationStatics = this._settings.statics): IApplicationManualSetup {
  //   this.markMethodAsManuallyCalled(this.setupStatics.name);
  //   if (statics) this._settings.statics = statics;
  //   return this.manualSetup();
  // }

  protected setupMiddlewares(middlewares: ApplicationMiddlewareList = this._settings.middlewares): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupMiddlewares.name);
    if (middlewares) this._settings.middlewares = middlewares;
    return this.manualSetup();
  }

  protected setupNotFoundHandler(handler: ApplicationMiddleware = this._settings.notFoundHandler): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupNotFoundHandler.name);
    if (handler) this._settings.notFoundHandler = handler;
    return this.manualSetup();
  }

  protected setupWebApps(webApps: ApplicationWebApps = this._settings.webApps): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupWebApps.name);
    if (webApps) this._settings.webApps = webApps;
    return this.manualSetup();
  }

  protected setupGlobalErrorHandler(handler: ApplicationErrorMiddleware = this._settings.globalErrorHandler): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupGlobalErrorHandler.name);
    if (handler) this._settings.globalErrorHandler = handler;
    return this.manualSetup();
  }

  protected markMethodAsManuallyCalled(methodName: ApplicationManuallyCalledMethod | string): void {
    this._settings.manuallyCalledMethodsOrder.push(methodName as ApplicationManuallyCalledMethod);
  }

  protected insertUseBeforeMiddlewares(): void {
    this._useBeforeMethodsOrder.forEach(([methodName, middlewares]) => {
      const index = this._settings.manuallyCalledMethodsOrder.findIndex((item) => item === methodName);
      const beforeIndex = index > -1 ? Math.max(index, 0) : -1;
      if (beforeIndex !== -1) this._settings.manuallyCalledMethodsOrder.splice(beforeIndex, 0, middlewares);
      else this._settings.manuallyCalledMethodsOrder.push(middlewares);
    });
  }

  protected applySettings(): void {
    if (this._settings.patchBodyParamsDecorator) patchBodyParamsDecorator();
    if (this._settings.log) this._settings.loggedSend = createLoggedSend(this._settings.log);
  }

  private setDefaultSwagger(settings: IApplicationPrivateSettings): void {
    if (!this._settings.setSwaggerForApiBaseByDefault || !settings.apiBase || typeof settings.apiBase !== 'string') return;
    const swagger: SwaggerSettings[] = [];
    swagger.push({ path: `${settings.apiBase}/api-docs` });
    if (!this._settings.swagger) this._settings.swagger = [];
    this._settings.swagger = (this._settings.swagger as SwaggerSettings[]).concat(swagger);
  }

  private setDefaultMount(settings: IApplicationPrivateSettings): void {
    if (!settings.apiBase || !settings.useDefaultControllers) return;
    if (typeof settings.apiBase === 'string') this.mergeMount({ [settings.apiBase]: [InfoController, HealthController] });
    else settings.apiBase.forEach((path) => this.mergeMount({ [path]: [InfoController, HealthController] }));
  }

  private mergeMount(mount: EndpointDirectoriesSettings): void {
    if (!this._settings.mount) this._settings.mount = {};
    const result = this._settings.mount;
    Object.entries(mount).forEach(([key, value]) => {
      const routes = Array.isArray(value) ? value : [value];
      const existingMount = Array.isArray(result[key]) ? result[key] : [result[key]] as EndpointDirectoriesSettings;
      if (!result[key]) result[key] = routes;
      else result[key] = existingMount.concat(routes);
    });
    this._settings.mount = result;
  }
}
