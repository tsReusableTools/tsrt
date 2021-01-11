/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import { parse } from 'qs';
import helmet from 'helmet';

import { PlatformApplication, EndpointDirectoriesSettings } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express';
import '@tsed/ajv';
import { SwaggerSettings } from '@tsed/swagger';

import { capitalize } from '@tsrt/utils';
import { session } from '@tsrt/session';

import {
  IApplicationSettings, IApplicationPrivateSettings, IApplicationManualSetup,
  IApplicationSession, IApplicationSendResponseHandler, ApplicationStatics,
  ApplicationMiddlewareList, ApplicationWebApps, ApplicationMiddleware, ApplicationErrorMiddleware,
  ApplicationManuallyCalledMethod,
} from './interfaces';
import { HealthController } from './controllers/HealthController';
import { InfoController } from './controllers/InfoController';
import { ParseCookiesHandler, RequestIdHandler } from './middlewares';
import { defaultTsedSettings } from './utils/defaultSettings';
import { patchValidatorsWithoutGroups } from './utils/patchValidatorsWithoutGroups';
import './pipes';

@Configuration(defaultTsedSettings as Configuration)
export class Server {
  @Inject() private _app: PlatformApplication;
  @Configuration() private _settings: IApplicationPrivateSettings;

  public $beforeInit(): void {
    console.log('this._settings.manuallyCalledMethodsOrder >>>', this._settings.manuallyCalledMethodsOrder);
    this.setDefaultSwagger(this._settings);
    this.setDefaultMount(this._settings);
    if (this.getMethodIndex('setupQueryParser') !== -1) this.callApplicationMethods(['setupQueryParser']);
  }

  public $beforeRoutesInit(): void {
    const notFoundIndex = this.getMethodIndex('setupNotFoundHandler');
    const methods = this.methods.slice(0, notFoundIndex).filter((item) => item !== 'setupQueryParser');
    console.log('beforeRoutesInit methods >>>', methods);
    this.callApplicationMethods(methods);
  }

  public $afterRoutesInit(): void {
    const notFoundIndex = this.getMethodIndex('setupNotFoundHandler');
    const methods = this.methods.slice(notFoundIndex);
    console.log('afterRoutesInit methods >>>', methods);
    this.callApplicationMethods(methods);
  }

  public $beforeListen(): void {
    if (this._settings.patchValidatorsWithoutGroups) patchValidatorsWithoutGroups();
  }

  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
  //                                      Methods
  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

  protected set(setting: string, value: any): Server {
    this._app.raw.set(setting, value);
    return this;
  }

  protected use(...handlers: any[]): Server {
    if (this._settings.debug && this._settings.log) {
      const route = handlers && typeof handlers[0] === 'string' ? handlers[0] : '/';
      this._settings.log.debug(handlers, `Setting middleware for \`${route}\``);
    }
    this._app.use(...handlers);
    return this;
  }

  protected setupQueryParser(cb?: (str: string) => any): Server {
    // this.markMethodAsManuallyCalled(this.setupQueryParser.name, cb ?? this._settings.qs);
    this.set('query parser', cb ?? ((str: string) => parse(str, this._settings.qs)));
    return this;
  }

  protected setupDefaultExpressMiddlewares(): Server {
    // this.markMethodAsManuallyCalled(this.setupDefaultExpressMiddlewares.name);
    this
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors(this._settings.cors))
      .use(helmet(this._settings.helmet))
      .use(ParseCookiesHandler);
    return this;
  }

  protected setupRequestIdMiddleware(): Server {
    // this.markMethodAsManuallyCalled(this.setupRequestIdMiddleware.name);
    this.use(RequestIdHandler);
    return this;
  }

  protected setupSession(sessionConfig: IApplicationSession = this._settings.session): Server {
    // this.markMethodAsManuallyCalled(this.setupSession.name, sessionConfig ?? { });
    if (!sessionConfig) return this;
    this._app.raw.set('trust proxy', 1);
    if (!sessionConfig.paths) this.use(session(sessionConfig));
    else {
      (Array.isArray(sessionConfig.paths) ? sessionConfig.paths : [sessionConfig.paths]).forEach((item) => {
        this.use(item, session(sessionConfig));
      });
    }
    return this;
  }

  protected setupSendResponseMiddleware(
    handler: IApplicationSendResponseHandler = this._settings.sendResponseHandler,
  ): Server {
    // this.markMethodAsManuallyCalled(this.setupSendResponseMiddleware.name);
    if (handler) this._settings.sendResponseHandler = handler;
    return this;
  }

  // Temporary commented in order to use native TsED.
  // protected setupStatics(statics: ApplicationStatics = this._settings.statics): Server {
  //   // this.markMethodAsManuallyCalled(this.setupStatics.name, statics ?? { });
  //   if (!statics) return this;
  //   if (Array.isArray(statics)) {
  //     statics.forEach((item) => this.use(express.static(item)));
  //   } else if (typeof statics === 'object') {
  //     Object.entries(statics).forEach(([key, value]) => this.use(key, express.static(value)));
  //   }
  //   return this;
  // }

  protected setupMiddlewares(middlewares: ApplicationMiddlewareList = this._settings.middlewares): Server {
    if (!middlewares) return this;

    Object.entries(middlewares).forEach(([key, value]) => (Array.isArray(value)
      ? value.forEach((item) => this.use(key, item))
      : this.use(key, value)));

    return this;
  }

  protected setupNotFoundHandler(handler: ApplicationMiddleware = this._settings.notFoundHandler): Server {
    if (!this._settings.webApps) return this.use(handler);
    if (!this._settings.apiBase) return this;
    if (typeof this._settings.apiBase === 'string') this.use(this._settings.apiBase, handler);
    else this._settings.apiBase.forEach((item) => this._app.use(item, handler));

    return this;
  }

  protected setupWebApps(webApps: ApplicationWebApps = this._settings.webApps): Server {
    if (!webApps) return this;
    if (typeof webApps === 'string') this.serveWebApp(webApps);
    else Object.entries(webApps).forEach(([key, value]) => this.serveWebApp(value, key));
    return this;
  }

  protected setupGlobalErrorHandler(handler: ApplicationErrorMiddleware = this._settings.globalErrorHandler): Server {
    this.use(handler);
    return this;
  }

  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
  //                                      Private
  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

  private get methods(): ApplicationManuallyCalledMethod[] {
    return this._settings.manuallyCalledMethodsOrder ?? [];
  }

  private getMethodIndex(methodName: keyof IApplicationManualSetup): number {
    if (!this._settings.manuallyCalledMethodsOrder) return -1;
    return this._settings.manuallyCalledMethodsOrder.findIndex((item) => item === methodName);
    // return this._settings.manuallyCalledMethodsOrder && this._settings.manuallyCalledMethodsOrder.includes(methodName);
  }

  private callApplicationMethods(methods: ApplicationManuallyCalledMethod[]): void {
    methods.forEach((item) => {
      const context = this as GenericObject;
      if (!Array.isArray(item) && context[item] && typeof context[item] === 'function') {
        if (this._settings.debug && this._settings.log) this._settings.log.debug(`${capitalize(item)}`);
        context[item]();
      }
      if (Array.isArray(item)) {
        const [method, ...args] = item;
        if (!context[method] || typeof context[method] !== 'function') return;
        context[method](args);
      }
    });
  }

  private serveWebApp(webAppPath: string, endPoint = '*'): void {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    if (!webAppPath.startsWith('/')) throw Error('Web App path must be absolute');
    const { dir, index } = this.getWebAppMetadata(webAppPath);
    this.use(express.static(dir));
    this.use(endPoint, (_req: Request, res: Response) => res.sendFile(index));
  }

  private getWebAppMetadata(webAppPath: string): { dir: string; index: string } {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    const reg = /\w*\.(html|php|hbs|ejs)$/;
    const dir = webAppPath.replace(reg, '');
    const index = webAppPath.match(reg) ? webAppPath : `${webAppPath}/index.html`;
    return { dir, index };
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

  private convertMapToObject(map: Map<string, any>): IApplicationSettings {
    const result: IApplicationSettings = { };
    map.forEach((value, key) => { result[key] = value; });
    return result;
  }
}
