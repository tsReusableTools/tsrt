import express, { Request, Response, json, urlencoded, Router } from 'express';
import cors from 'cors';
import { parse } from 'qs';
import helmet from 'helmet';
import merge from 'deepmerge';
import glob from 'glob';

import { isEmpty, getObjectValuesList } from '@tsrt/utils';
import { log } from '@tsrt/logger';
import { session } from '@tsrt/session';

import {
  IApplication, IApplicationConfig, IApplicationSettings, ApplicationStatics,
  ApplicationWebApps, TypeOrArrayOfTypes, ApplicationMountList, ApplicationMount,
  ApplicationMiddlewareList, IApplicationSession,
} from './interfaces';
import {
  sendResponseHandler, globalErrorHandler, notFoundHandler, requestIdHandler, parseRequestHandler,
} from './middlewares';
import { InfoController, HealthController } from './controllers';

export class Application<T extends IApplication = IApplication> {
  private _app: T;
  private _settings: IApplicationSettings<T> = {
    apiBase: '/api/v1',
    cors: { credentials: true, origin: true },
    qs: { strictNullHandling: true, comma: true },
    useDefaultControllers: true,
    mount: {},
    middlewares: {},
  };
  private _isManualMiddlewaresOrder = false;

  constructor(settings: IApplicationSettings<T> = { }, app?: T) {
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
      setSession: this.setSession.bind(this),
      setSendResponseMiddleware: this.setSendResponseMiddleware.bind(this),
      setStatics: this.setStatics.bind(this),
      setMiddlewares: this.setMiddlewares.bind(this),
      setRouter: this.setRouter.bind(this),
      setNotFoundHandler: this.setNotFoundHandler.bind(this),
      setWebApps: this.setWebApps.bind(this),
      setGlobalErrorHandler: this.setGlobalErrorHandler.bind(this),
    };
  }

  public addRoutes(mount: ApplicationMountList): Application {
    if (!mount) return;
    if (!this._settings.mount) this._settings.mount = {};
    this._settings.mount = this.setRequestHandlers(this._settings.mount, mount);
    return this;
  }

  public addMiddlewares(middlewares: ApplicationMiddlewareList): Application {
    if (!middlewares) return;
    if (!this._settings.middlewares) this._settings.middlewares = {};
    this._settings.middlewares = this.setRequestHandlers(this._settings.middlewares, middlewares);
    return this;
  }

  public addSession(sessionConfig: IApplicationSession): Application {
    if (sessionConfig) this._settings.session = sessionConfig;
    return this;
  }

  public start(): void {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    if (!this._isManualMiddlewaresOrder) this.setAllMiddlewares();
    this._app.listen(this._settings.port, () => log.info(`Listen to port: ${this._settings.port}. Pid: ${process.pid}`));
  }

  protected setAllMiddlewares(): IApplicationConfig {
    this.setQueryParser();
    this.setDefaultMiddlewares();
    this.setRequestIdMiddleware();
    this.setSession();
    this.setSendResponseMiddleware();
    this.setStatics();
    this.setMiddlewares();
    this.setRouter();
    this.setNotFoundHandler();
    this.setWebApps();
    this.setGlobalErrorHandler();
    return this.config;
  }

  protected setQueryParser(): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    this._app.set('query parser', (str: string) => parse(str, this._settings.qs));
    return this.config;
  }

  protected setDefaultMiddlewares(): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    this._app
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors(this._settings.cors))
      .use(helmet(this._settings.helmet))
      .use(parseRequestHandler);
    return this.config;
  }

  protected setRequestIdMiddleware(): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    this._app.use(requestIdHandler);
    return this.config;
  }

  protected setSession(sessionConfig: IApplicationSession = this._settings.session): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!sessionConfig) return;
    this._app.set('trust proxy', 1);
    if (!sessionConfig.paths) this._app.use(session(sessionConfig));
    else {
      (Array.isArray(sessionConfig.paths) ? sessionConfig.paths : [sessionConfig.paths]).forEach((item) => {
        this._app.use(item, session(sessionConfig));
      });
    }
    return this.config;
  }

  protected setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!paths) this._app.use(sendResponseHandler);
    else if (typeof paths === 'string' || paths instanceof RegExp) this._app.use(paths, sendResponseHandler);
    else paths.forEach((item) => this._app.use(item, sendResponseHandler));
    return this.config;
  }

  protected setStatics(statics: ApplicationStatics = this._settings.statics): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!statics) return this.config;
    if (Array.isArray(statics)) {
      statics.forEach((item) => this._app.use(express.static(item)));
    } else if (typeof statics === 'object') {
      Object.entries(statics).forEach(([key, value]) => this._app.use(key, express.static(value)));
    }
    return this.config;
  }

  protected setMiddlewares(middlewares: ApplicationMiddlewareList = this._settings.middlewares): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!middlewares) return this.config;

    Object.entries(middlewares).forEach(([key, value]) => (Array.isArray(value)
      ? value.forEach((item) => this._app.use(key, item))
      : this._app.use(key, value)));

    return this.config;
  }

  protected setRouter(mount: ApplicationMountList = this._settings.mount): IApplicationConfig {
    this.setManualMiddlewaresOrder();

    if (this._settings.useDefaultControllers && this._settings.apiBase) {
      if (typeof this._settings.apiBase === 'string') this.addRoutes({ [this._settings.apiBase]: [InfoController, HealthController] });
      else this._settings.apiBase.forEach((path) => { this.addRoutes({ [path]: [InfoController, HealthController] }); });
    }

    if (!mount) return this.config;

    try {
      Object.entries(mount).forEach(([key, value]) => (Array.isArray(value)
        ? value.forEach((item) => this._app.use(key, this.getRouters(item)))
        : this._app.use(key, this.getRouters(value))));
    } catch (err) {
      this.throwError(err, 'Invalid router provided');
    }

    return this.config;
  }

  protected setNotFoundHandler(): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!this._settings.webApps) {
      this._app.use(notFoundHandler);
      return;
    }
    if (!this._settings.apiBase) return;
    if (typeof this._settings.apiBase === 'string') this._app.use(this._settings.apiBase, notFoundHandler);
    else this._settings.apiBase.forEach((item) => this._app.use(item, notFoundHandler));

    return this.config;
  }

  protected setWebApps(webApps: ApplicationWebApps = this._settings.webApps): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    if (!webApps) return this.config;

    if (typeof webApps === 'string') this.serveWebApp(webApps);
    else Object.entries(webApps).forEach(([key, value]) => this.serveWebApp(value, key));

    return this.config;
  }

  protected setGlobalErrorHandler(): IApplicationConfig {
    this.setManualMiddlewaresOrder();
    this._app.use(globalErrorHandler);
    return this.config;
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

  protected getRouters(router: string | Router): Router[] {
    if (typeof router !== 'string') return [router];

    const paths = glob.hasMagic(router) ? glob.sync(router) : [router];
    return paths
      .map((item) => {
        /* eslint-disable-next-line */
        const importedRouter = require(item);
        const routerInstance = importedRouter && importedRouter.default
          ? importedRouter.default
          : getObjectValuesList(importedRouter)
            .find((rtr) => typeof rtr === 'function' && rtr && rtr.stack && rtr.stack[0] && rtr.stack[0].route);

        return routerInstance;
      })
      .filter((item) => !isEmpty(item));
  }

  protected setRequestHandlers<T extends GenericObject>(container: T, requestHandlers: T): T {
    const result = { ...container };
    Object.entries(requestHandlers).forEach(([key, value]) => {
      const routes = Array.isArray(value) ? value : [value];
      if (!result[key]) (result[key] as GenericObject) = routes;
      else (result[key] as GenericObject) = (Array.isArray(result[key]) ? result[key] : [result[key]]).concat(routes);
    });
    return result;
  }

  protected getMountArrays(mount: TypeOrArrayOfTypes<ApplicationMount>): ApplicationMount[] {
    return Array.isArray(mount) ? mount : [mount];
  }

  /* eslint-disable-next-line */
  protected throwError(originalError: any, message: string): void {
    throw new Error(JSON.stringify({ message, originalError: originalError?.message }));
  }
}
