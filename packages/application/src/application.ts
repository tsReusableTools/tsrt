import express, { Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import { parse } from 'qs';
import helmet from 'helmet';
import merge from 'deepmerge';

import { log } from '@tsd/utils';
import { parseRequest } from '@tsd/api';

import {
  IApplication, IApplicationConfig, IApplicationSettings, ApplicationRouters, ApplicationStatics,
  ApplicationWebApps, TypeOrArrayOfTypes,
} from './interfaces';
import { sendResponseHandler, globalErrorHandler, notFoundHandler, requestIdHandler } from './middlewares';

export class Application<T extends IApplication = IApplication> {
  private _app: T;
  private _settings: IApplicationSettings<T> = {
    apiBase: '/api/v1',
    cors: { credentials: true, origin: true },
    qs: { strictNullHandling: true, comma: true },
    routers: [],
  };
  private _isManualMiddlewaresOrder = false;

  constructor(settings: IApplicationSettings<T>, app?: T) {
    this._settings = merge({ ...this._settings }, { ...settings });
    this._app = app || settings.app || express() as unknown as T;
  }

  public get app(): T { return this._app; }

  public get settings(): IApplicationSettings<T> { return { ...this._settings }; }

  public get config(): IApplicationConfig {
    return {
      setAllMiddlewares: this.setAllMiddlewares.bind(this),
      setQueryParser: this.setQueryParser.bind(this),
      setDefaultMiddlewares: this.setDefaultMiddlewares.bind(this),
      setRequestIdMiddleware: this.setRequestIdMiddleware.bind(this),
      setSendResponseMiddleware: this.setSendResponseMiddleware.bind(this),
      setStatics: this.setStatics.bind(this),
      setRouter: this.setRouter.bind(this),
      setNotFoundHandler: this.setNotFoundHandler.bind(this),
      setWebApps: this.setWebApps.bind(this),
      setGlobalErrorHandler: this.setGlobalErrorHandler.bind(this),
    };
  }

  public addRoutes(...routers: ApplicationRouters): void {
    if (!this._settings.routers) this._settings.routers = [];
    this._settings.routers.push(...routers);
  }

  public start(): void {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    if (!this._isManualMiddlewaresOrder) this.setAllMiddlewares();
    this._app.listen(this._settings.port, () => log.info(`Listen to port: ${this._settings.port}. Pid: ${process.pid}`));
  }

  protected setAllMiddlewares(): void {
    this.setQueryParser();
    this.setDefaultMiddlewares();
    this.setRequestIdMiddleware();
    this.setSendResponseMiddleware();
    this.setStatics();
    this.setRouter();
    this.setNotFoundHandler();
    this.setWebApps();
    this.setGlobalErrorHandler();
  }

  protected setQueryParser(): void {
    this.setManualMiddlewaresOrder();
    this._app.set('query parser', (str: string) => parse(str, this._settings.qs));
  }

  protected setDefaultMiddlewares(): void {
    this.setManualMiddlewaresOrder();
    this._app
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors(this._settings.cors))
      .use(helmet(this._settings.helmet))
      .use(parseRequest);
    // .use(requestContext.attachContext);
  }

  protected setRequestIdMiddleware(): void {
    this.setManualMiddlewaresOrder();
    this._app.use(requestIdHandler);
  }

  protected setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): void {
    this.setManualMiddlewaresOrder();
    if (!paths) this._app.use(sendResponseHandler);
    else if (typeof paths === 'string' || paths instanceof RegExp) this._app.use(paths, sendResponseHandler);
    else paths.forEach((item) => this._app.use(item, sendResponseHandler));
  }

  protected setStatics(statics: ApplicationStatics = this._settings.statics): void {
    this.setManualMiddlewaresOrder();
    if (!statics) return;
    if (Array.isArray(statics)) {
      statics.forEach((item) => this._app.use(express.static(item)));
    } else if (typeof statics === 'object') {
      Object.entries(statics).forEach(([key, value]) => this._app.use(key, express.static(value)));
    }
  }

  protected setRouter(routers: ApplicationRouters = this._settings.routers): void {
    this.setManualMiddlewaresOrder();
    if (!routers) return;
    routers.forEach((item) => (typeof item === 'object' ? this._app.use(item.path, item.router) : this._app.use(item)));
  }

  protected setNotFoundHandler(): void {
    this.setManualMiddlewaresOrder();
    if (!this._settings.webApps) {
      this._app.use(notFoundHandler);
      return;
    }
    if (!this._settings.apiBase) return;
    if (typeof this._settings.apiBase === 'string') this._app.use(this._settings.apiBase, notFoundHandler);
    else this._settings.apiBase.forEach((item) => this._app.use(item, notFoundHandler));
  }

  protected setWebApps(webApps: ApplicationWebApps = this._settings.webApps): void {
    this.setManualMiddlewaresOrder();
    if (!webApps) return;

    if (typeof webApps === 'string') this.serveWebApp(webApps);
    else Object.entries(webApps).forEach(([key, value]) => this.serveWebApp(value, key));
  }

  protected setGlobalErrorHandler(): void {
    this.setManualMiddlewaresOrder();
    this._app.use(globalErrorHandler);
  }

  protected setManualMiddlewaresOrder(): void {
    this._isManualMiddlewaresOrder = true;
  }

  protected serveWebApp(webAppPath: string, endPoint = '*'): void {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    if (!webAppPath.startsWith('/')) throw Error('Web App path must be absolute');
    const { dir, index } = this.getWebAppMetadata(webAppPath);
    this._app.use(express.static(dir));
    this._app.use(endPoint, (_req: Request, res: Response) => res.sendFile(index));
  }

  protected getWebAppMetadata(webAppPath: string): { dir: string; index: string } {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    const reg = /index\.(html|php)$/;
    const dir = webAppPath.replace(reg, '');
    const index = webAppPath.match(reg) ? webAppPath : `${webAppPath}/index.html`;
    return { dir, index };
  }
}
