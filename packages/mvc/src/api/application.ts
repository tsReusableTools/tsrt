import express, { Request, Response, Router, Application as ExpressApplication } from 'express';
import cors, { CorsOptions } from 'cors';
import { IParseOptions, parse } from 'qs';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import { deepMerge } from '@tsed/core';

import { log } from '@tsd/utils';
import { parseRequest, requestContext } from '@tsd/api';

import { sendResponseMiddleware, globalErrorHandler, notFoundHandler } from './middlewares';

export interface IApplicationSettings {
  port?: number;
  statics?: string[] | Record<string, string>;
  webApp?: string | Record<string, string>;
  apiBase?: string | string[];
  cors?: CorsOptions;
  qs?: IParseOptions;
  routers?: Router[];
}

export class Application<T extends ExpressApplication> {
  public static defaultSettings: IApplicationSettings = {
    apiBase: '/api/v1',
    cors: { credentials: true, origin: true },
    qs: { strictNullHandling: true, comma: true },
    routers: [],
  }

  private _app: T;
  private _settings: IApplicationSettings;

  constructor(settings: IApplicationSettings, app?: T) {
    this._settings = deepMerge({ ...Application.defaultSettings }, settings);
    this._app = app || express() as unknown as T;
  }

  public static setSendResponseMiddleware<T extends ExpressApplication>(app: T): void {
    app.use(sendResponseMiddleware);
  }

  public static setQueryParser<T extends ExpressApplication>(app: T, settings: IApplicationSettings = Application.defaultSettings): void {
    app.set('query parser', (str: string) => parse(str, settings.qs));
  }

  public static setCors<T extends ExpressApplication>(app: T, settings: IApplicationSettings = Application.defaultSettings): void {
    app.use(cors(settings.cors));
  }

  public static setDefaultMiddlewares<T extends ExpressApplication>(app: T): void {
    app
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(helmet())
      .use(parseRequest)
      .use(requestContext.attachContext);
  }

  public static setGlobalErrorHandler<T extends ExpressApplication>(app: T): void {
    app.use(globalErrorHandler);
  }

  public get settings(): IApplicationSettings { return { ...this._settings }; }

  public addRoutes(...routers: Router[]): void {
    if (!this._settings.routers) this._settings.routers = [];
    this._settings.routers.push(...routers);
  }

  public start(): void {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    this.setAllMiddlewares();
    this._app.listen(this._settings.port, () => log.info(`Listen to port: ${this._settings.port}. Pid: ${process.pid}`));
  }

  protected setAllMiddlewares(): void {
    Application.setQueryParser(this._app, this._settings);
    Application.setCors(this._app, this._settings);
    Application.setDefaultMiddlewares(this._app);
    Application.setSendResponseMiddleware(this._app);
    this.setStatics();
    this.setRouter();
    this.setNotFoundHandler();
    this.setWebApps();
    Application.setGlobalErrorHandler(this._app);
  }

  protected setRouter(): void {
    if (this._settings.routers) this._settings.routers.forEach((item) => this._app.use(item));
  }

  protected setNotFoundHandler(): void {
    if (!this._settings.webApp) {
      this._app.use(notFoundHandler);
      return;
    }
    if (!this._settings.apiBase) return;
    if (typeof this._settings.apiBase === 'string') this._app.use(this._settings.apiBase, notFoundHandler);
    else this._settings.apiBase.forEach((item) => this._app.use(item, notFoundHandler));
  }

  protected setStatics(): void {
    if (!this._settings.statics) return;
    if (Array.isArray(this._settings.statics)) {
      this._settings.statics.forEach((item) => this._app.use(express.static(item)));
    } else if (typeof this._settings.statics === 'object') {
      Object.entries(this._settings.statics).forEach(([key, value]) => this._app.use(key, express.static(value)));
    }
  }

  protected setWebApps(): void {
    if (!this.settings.webApp) return;

    if (typeof this.settings.webApp === 'string') this.serveWebApp(this.settings.webApp);
    else Object.entries(this.settings.webApp).forEach(([key, value]) => this.serveWebApp(value, key));
  }

  private serveWebApp(webAppPath: string, endPoint = '*'): void {
    if (!webAppPath) throw Error('Invalid webApp path provided');
    const { dir, index } = this.getWebAppMetadata(webAppPath);
    this._app.use(express.static(dir));
    this._app.use(endPoint, (_req: Request, res: Response) => res.sendFile(index));
  }

  private getWebAppMetadata(webAppPath: string): { dir: string; index: string } {
    if (!webAppPath) throw Error('Invalid webApp path provided');
    const reg = /index\.(html|php)$/;
    const dir = webAppPath.replace(reg, '');
    const index = webAppPath.match(reg) ? webAppPath : `${webAppPath}/index.html`;
    return { dir, index };
  }
}
