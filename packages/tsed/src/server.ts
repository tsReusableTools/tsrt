/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import { parse } from 'qs';
import helmet from 'helmet';

import { PlatformApplication } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express';
import '@tsed/swagger';

import { capitalize } from '@tsrt/utils';
import { session } from '@tsrt/session';

import {
  IApplicationPrivateSettings, IApplicationManualSetup, ApplicationSession,
  ApplicationWebApps, ApplicationMiddleware,
  ApplicationErrorMiddleware, ApplicationManuallyCalledMethod,
} from './interfaces';
import { ParseCookiesHandler, RequestIdHandler } from './middlewares';
import { defaultTsedSettings } from './utils/defaultSettings';
import { patchValidatorsWithoutGroups } from './utils/patchValidatorsWithoutGroups';
import './pipes';

@Configuration(defaultTsedSettings as Configuration)
export class Server {
  @Inject() private _app: PlatformApplication;
  @Configuration() private _settings: IApplicationPrivateSettings;

  public $beforeInit(): void {
    if (this.getMethodIndex('setupQueryParser') !== -1) this.callApplicationMethods(['setupQueryParser']);
  }

  public $beforeRoutesInit(): void {
    const index = this.getDelimetrIndex();
    const methods = this.methods.slice(0, index).filter((item) => item !== 'setupQueryParser');
    this.callApplicationMethods(methods);
  }

  public $afterRoutesInit(): void {
    const index = this.getDelimetrIndex();
    const methods = this.methods.slice(index).filter((item) => item !== 'setupQueryParser');
    this.callApplicationMethods(methods);
  }

  public $beforeListen(): void {
    if (this._settings.patchValidatorsWithoutGroups) patchValidatorsWithoutGroups();
  }

  public $onReady(): void {
    if (this._settings.debug && this._settings.debugMode === 'Application') this._settings.logger.level = 'error';
  }

  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
  //                                      Methods
  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

  protected set(setting: string, value: any): Server {
    this._app.rawApp.set(setting, value);
    return this;
  }

  protected use(...handlers: any[]): Server {
    if (this._settings.debug && this._settings.debugMode !== 'TsED' && this._settings.log) {
      const route = handlers && typeof handlers[0] === 'string' ? handlers[0] : '/';
      this._settings.log.debug(handlers, `Setting middleware for \`${route}\``);
    }
    this._app.use(...handlers);
    return this;
  }

  protected setupQueryParser(cb?: (str: string) => any): Server {
    this.set('query parser', cb ?? ((str: string) => parse(decodeURIComponent(str), this._settings.qs)));
    return this;
  }

  protected setupDefaultExpressMiddlewares(): Server {
    this
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors(this._settings.cors))
      .use(helmet(this._settings.helmet))
      .use(ParseCookiesHandler);
    return this;
  }

  protected setupRequestIdMiddleware(): Server {
    this.use(RequestIdHandler);
    return this;
  }

  protected setupSession(sessionConfig: ApplicationSession = this._settings.session): Server {
    if (!sessionConfig) return this;
    this._app.rawApp.set('trust proxy', 1);
    const middleware = typeof sessionConfig === 'function' ? sessionConfig : session(sessionConfig);
    const paths = typeof sessionConfig === 'object' ? sessionConfig.paths : null;
    if (!paths) this.use(middleware);
    else (Array.isArray(paths) ? paths : [paths]).forEach((item) => { this.use(item, middleware); });
    return this;
  }

  protected setupSendResponseHandler(handler: Constructor = this._settings.sendResponseHandler): Server {
    if (!handler) return this;
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

  private getDelimetrIndex() {
    let index = this.getMethodIndex('setupNotFoundHandler');
    if (index === -1) index = this.getMethodIndex('setupWebApps');
    if (index === -1) index = this.getMethodIndex('setupGlobalErrorHandler');
    if (index === -1) index = this.methods.length;
    return index;
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
        if (this._settings.debug && this._settings.debugMode !== 'TsED' && this._settings.log) {
          this._settings.log.debug(`${capitalize(item)}`);
        }
        context[item]();
      }
      if (Array.isArray(item)) {
        const [method, ...args] = item;
        if (!context[method] || typeof context[method] !== 'function') return;
        context[method](...args);
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
}
