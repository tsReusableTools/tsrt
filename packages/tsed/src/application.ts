/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler, ErrorRequestHandler } from 'express';
import { PlatformExpress } from '@tsed/platform-express';
import { Configuration } from '@tsed/common';
import merge from 'deepmerge';
import isPlainObject from 'is-plain-obj';

import { createLoggedSend } from '@tsrt/api-utils';
import { isNil } from '@tsrt/utils';

import {
  IApplicationSettings, IApplicationPrivateSettings, IApplicationSendResponseHandler,
  IApplicationManualSetup, Callback, IApplicationManualSetupSettings, IApplicationSession,
  ApplicationMiddlewareList, ApplicationWebApps, ApplicationStatics,
  ApplicationMiddleware, ApplicationErrorMiddleware, ApplicationManuallyCalledMethod, IApplicationMethods,
} from './interfaces';
import { patchBodyParamsDecorator } from './pipes/BodyParamsPipe';
import { defaultSettings } from './utils/defaultSettings';
import { Server } from './server';

// type IApplicationManualSetup = Partial<TT>;

export class Application {
  private _settings: IApplicationPrivateSettings = { manuallyCalledMethodsOrder: [], ...defaultSettings };
  // private _useBeforeMethodsOrder: Partial<Record<keyof IApplicationMethods, ApplicationManuallyCalledMethod>> = { };
  private _useBeforeMethodsOrder: Array<[keyof IApplicationMethods, ApplicationManuallyCalledMethod]> = [];
  private _manualSetupSettings: IApplicationManualSetupSettings = { useMethodsByDefault: true };

  constructor(settings: IApplicationSettings) {
    this._settings = merge({ ...this._settings }, settings, { isMergeableObject: isPlainObject }) as IApplicationPrivateSettings;
    this.applySettings();
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
      setupSendResponseMiddleware: this.setupSendResponseMiddleware.bind(this),
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
      this.setupSendResponseMiddleware,
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
    // const index = this._settings.manuallyCalledMethodsOrder.findIndex((item) => item === methodName);
    // console.log('index >>>', index);
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

  protected setupSendResponseMiddleware(
    handler: IApplicationSendResponseHandler = this._settings.sendResponseHandler,
  ): IApplicationManualSetup {
    this.markMethodAsManuallyCalled(this.setupSendResponseMiddleware.name);
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

  protected markMethodAsManuallyCalled(methodName: ApplicationManuallyCalledMethod | string, newIndex?: number): void {
    // console.log('newIndex >>>', newIndex);
    // const index = newIndex >= -1 ? Math.max(newIndex, 0) : newIndex;
    // console.log('markMethodAsManuallyCalled index >>>', index);
    // if (index >= -1) this._settings.manuallyCalledMethodsOrder.splice(index, 0, methodName as ApplicationManuallyCalledMethod);
    // else this._settings.manuallyCalledMethodsOrder.push(methodName as ApplicationManuallyCalledMethod);
    this._settings.manuallyCalledMethodsOrder.push(methodName as ApplicationManuallyCalledMethod);
  }

  protected insertUseBeforeMiddlewares(): void {
    console.log('this._useBeforeMethodsOrder >>>', this._useBeforeMethodsOrder);
    this._useBeforeMethodsOrder.forEach(([methodName, middlewares]) => {
      console.log('methodName >>>', methodName);
      const index = this._settings.manuallyCalledMethodsOrder.findIndex((item) => item === methodName);
      console.log('index >>>', index);
      const beforeIndex = index > -1 ? Math.max(index, 0) : -1;
      console.log('beforeIndex >>>', beforeIndex);
      if (beforeIndex !== -1) this._settings.manuallyCalledMethodsOrder.splice(beforeIndex, 0, middlewares);
      else this._settings.manuallyCalledMethodsOrder.push(middlewares);
    });
  }

  protected applySettings(): void {
    if (this._settings.patchBodyParamsDecorator) patchBodyParamsDecorator();
    if (this._settings.log) this._settings.loggedSend = createLoggedSend(this._settings.log);
  }
}
