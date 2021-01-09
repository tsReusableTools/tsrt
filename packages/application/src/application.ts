// eslint-disable-next-line import/no-unresolved
import { ApplicationRequestHandler } from 'express-serve-static-core';
import express, { Request, Response, json, urlencoded, Router, RequestHandler, ErrorRequestHandler } from 'express';
import cors from 'cors';
import { parse } from 'qs';
import helmet from 'helmet';
import merge from 'deepmerge';
import glob from 'glob';
import isPlainObject from 'is-plain-obj';

import { isEmpty, getObjectValuesList, capitalize } from '@tsrt/utils';
import { session } from '@tsrt/session';
import { Logger } from '@tsrt/logger';

import {
  IApplication, IApplicationManualSetup, IApplicationSettings, ApplicationStatics,
  ApplicationWebApps, TypeOrArrayOfTypes, ApplicationMountList, ApplicationMount,
  ApplicationMiddlewareList, IApplicationSession, Callback,
} from './interfaces';
import {
  createSendResponseHandler, createGlobalErrorHandler, notFoundHandler, requestIdHandler, parseCookiesHandler,
} from './middlewares';
import { InfoController, HealthController } from './controllers';

export class Application<T extends IApplication = IApplication> {
  private _log = new Logger();
  private _app: T;
  private _settings: IApplicationSettings<T> = {
    apiBase: '/api/v1',
    cors: { credentials: true, origin: true },
    qs: { strictNullHandling: true, comma: true },
    notFoundHandler,
    useDefaultControllers: true,
    debug: false,
    mount: {},
    middlewares: {},
  };
  private _isManualMiddlewaresOrder = false;
  private _manuallyCalledMethods: GenericObject<boolean> = { };

  constructor(settings: IApplicationSettings<T> = { }, app?: T) {
    this._settings = merge({ ...this._settings }, settings, { isMergeableObject: isPlainObject });
    this._app = app ?? settings.app ?? express() as unknown as T;
    this.initializeLoggerDependentSettings();
  }

  public get app(): T { return this._app; }

  public get settings(): IApplicationSettings<T> { return { ...this._settings }; }

  public addRoutes(mount: ApplicationMountList): Application {
    if (!mount) return this;
    if (!this._settings.mount) this._settings.mount = {};
    this._settings.mount = this.setRequestHandlers(this._settings.mount, mount);
    return this;
  }

  public addMiddlewares(middlewares: ApplicationMiddlewareList): Application {
    if (!middlewares) return this;
    if (!this._settings.middlewares) this._settings.middlewares = {};
    this._settings.middlewares = this.setRequestHandlers(this._settings.middlewares, middlewares);
    return this;
  }

  public addSession(sessionConfig: IApplicationSession): Application {
    if (sessionConfig) this._settings.session = sessionConfig;
    return this;
  }

  public setSendResponseHandler(handler: RequestHandler): Application { this._settings.sendResponseHandler = handler; return this; }
  public setNotFoundHandler(handler: RequestHandler): Application { this._settings.notFoundHandler = handler; return this; }
  public setGlobalErrorHandler(handler: ErrorRequestHandler): Application { this._settings.globalErrorHandler = handler; return this; }

  public start(cb?: Callback): void {
    if (!this._settings.port) throw Error('It is necessary to provide at least `port` settings option');
    if (!this._isManualMiddlewaresOrder) this.setupAll();
    this._app.listen(this._settings.port, cb);
  }

  public manualSetup(): IApplicationManualSetup {
    return {
      set: this.set.bind(this),
      use: this.use.bind(this),

      setupAll: this.setupAll.bind(this),
      setupQueryParser: this.setupQueryParser.bind(this),
      setupDefaultExpressMiddlewares: this.setupDefaultExpressMiddlewares.bind(this),
      setupRequestIdMiddleware: this.setupRequestIdMiddleware.bind(this),
      setupSession: this.setupSession.bind(this),
      setupSendResponseMiddleware: this.setupSendResponseMiddleware.bind(this),
      setupStatics: this.setupStatics.bind(this),
      setupMiddlewares: this.setupMiddlewares.bind(this),
      setupRouter: this.setupRouter.bind(this),
      setupNotFoundHandler: this.setupNotFoundHandler.bind(this),
      setupWebApps: this.setupWebApps.bind(this),
      setupGlobalErrorHandler: this.setupGlobalErrorHandler.bind(this),

      start: this.start.bind(this),
    };
  }

  protected setupAll(): IApplicationManualSetup {
    [
      this.setupQueryParser,
      this.setupDefaultExpressMiddlewares,
      this.setupRequestIdMiddleware,
      this.setupSession,
      this.setupSendResponseMiddleware,
      this.setupStatics,
      this.setupMiddlewares,
      this.setupRouter,
      this.setupNotFoundHandler,
      this.setupWebApps,
      this.setupGlobalErrorHandler,
    ].forEach((item) => {
      const called = Object.keys(this._manuallyCalledMethods).find((key) => key === item.name);
      if (!called) item.call(this);
    });
    return this.manualSetup();
  }

  /* eslint-disable-next-line */
  protected set(setting: string, value: any): IApplicationManualSetup {
    this._app.set(setting, value);
    return this.manualSetup();
  }

  /* eslint-disable-next-line */
  protected use: ApplicationRequestHandler<IApplicationManualSetup> = (...args: any[]): IApplicationManualSetup => {
    if (this.settings.debug) {
      const route = args && typeof args[0] === 'string' ? args[0] : '/';
      this._log.debug(args, `Setting middleware for \`${route}\``);
    }
    this._app.use(...args);
    return this.manualSetup();
  };

  /* eslint-disable-next-line */
  protected setupQueryParser(cb?: (str: string) => any): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupQueryParser.name, cb ?? this._settings.qs);
    this._app.set('query parser', cb ?? ((str: string) => parse(str, this._settings.qs)));
    return this.manualSetup();
  }

  protected setupDefaultExpressMiddlewares(): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupDefaultExpressMiddlewares.name);
    this
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors(this._settings.cors))
      .use(helmet(this._settings.helmet))
      .use(parseCookiesHandler);
    return this.manualSetup();
  }

  protected setupRequestIdMiddleware(): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupRequestIdMiddleware.name);
    this.use(requestIdHandler);
    return this.manualSetup();
  }

  protected setupSession(sessionConfig: IApplicationSession = this._settings.session): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupSession.name, sessionConfig ?? { });
    if (!sessionConfig) return this.manualSetup();
    this._app.set('trust proxy', 1);
    if (!sessionConfig.paths) this.use(session(sessionConfig));
    else {
      (Array.isArray(sessionConfig.paths) ? sessionConfig.paths : [sessionConfig.paths]).forEach((item) => {
        this.use(item, session(sessionConfig));
      });
    }
    return this.manualSetup();
  }

  protected setupSendResponseMiddleware(
    handler: RequestHandler = this._settings.sendResponseHandler, paths?: TypeOrArrayOfTypes<string | RegExp>,
  ): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupSendResponseMiddleware.name);
    if (!paths) this.use(handler);
    else if (typeof paths === 'string' || paths instanceof RegExp) this.use(paths, handler);
    else paths.forEach((item) => this.use(item, handler));
    return this.manualSetup();
  }

  protected setupStatics(statics: ApplicationStatics = this._settings.statics): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupStatics.name, statics ?? { });
    if (!statics) return this.manualSetup();
    if (Array.isArray(statics)) {
      statics.forEach((item) => this.use(express.static(item)));
    } else if (typeof statics === 'object') {
      Object.entries(statics).forEach(([key, value]) => this.use(key, express.static(value)));
    }
    return this.manualSetup();
  }

  protected setupMiddlewares(middlewares: ApplicationMiddlewareList = this._settings.middlewares): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupMiddlewares.name);
    if (!middlewares) return this.manualSetup();

    Object.entries(middlewares).forEach(([key, value]) => (Array.isArray(value)
      ? value.forEach((item) => this.use(key, item))
      : this.use(key, value)));

    return this.manualSetup();
  }

  protected setupRouter(mount: ApplicationMountList = this._settings.mount): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupRouter.name);

    let mountObject = { ...mount };

    if (this._settings.useDefaultControllers && this._settings.apiBase) {
      if (typeof this._settings.apiBase === 'string') {
        mountObject = this.setRequestHandlers(mountObject, { [this._settings.apiBase]: [InfoController, HealthController] });
      } else {
        this._settings.apiBase.forEach((path) => {
          mountObject = this.setRequestHandlers(mountObject, { [path]: [InfoController, HealthController] });
        });
      }
    }

    if (!mountObject) return this.manualSetup();

    if (this.settings.debug) {
      Object.entries(mountObject).forEach(([key, value]) => { this._log.debug(value, `Setting routers for \`${key}\``); });
    }

    try {
      Object.entries(mountObject).forEach(([key, value]) => (Array.isArray(value)
        ? value.forEach((item) => this._app.use(key, this.getRouters(item)))
        : this._app.use(key, this.getRouters(value))));
    } catch (err) {
      this.throwError(err, 'Invalid router provided');
    }

    return this.manualSetup();
  }

  protected setupNotFoundHandler(handler: RequestHandler = this._settings.notFoundHandler): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupNotFoundHandler.name);
    if (!this._settings.webApps) {
      this.use(handler);
      return this.manualSetup();
    }
    if (!this._settings.apiBase) return this.manualSetup();
    if (typeof this._settings.apiBase === 'string') this.use(this._settings.apiBase, handler);
    else this._settings.apiBase.forEach((item) => this._app.use(item, handler));

    return this.manualSetup();
  }

  protected setupWebApps(webApps: ApplicationWebApps = this._settings.webApps): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupWebApps.name, webApps);
    if (!webApps) return this.manualSetup();

    if (typeof webApps === 'string') this.serveWebApp(webApps);
    else Object.entries(webApps).forEach(([key, value]) => this.serveWebApp(value, key));

    return this.manualSetup();
  }

  protected setupGlobalErrorHandler(handler: ErrorRequestHandler = this._settings.globalErrorHandler): IApplicationManualSetup {
    this.setManualyCalledMethods(this.setupGlobalErrorHandler.name);
    this.use(handler);
    return this.manualSetup();
  }

  protected setManualyCalledMethods(methodName: string, logInfo?: GenericAny): void {
    if (this.settings.debug && logInfo) this._log.debug(logInfo, `${capitalize(methodName)}`);
    else if (this.settings.debug) this._log.debug(`${capitalize(methodName)}`);
    this._manuallyCalledMethods[methodName] = true;
  }

  protected serveWebApp(webAppPath: string, endPoint = '*'): void {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    if (!webAppPath.startsWith('/')) throw Error('Web App path must be absolute');
    const { dir, index } = this.getWebAppMetadata(webAppPath);
    this.use(express.static(dir));
    this.use(endPoint, (_req: Request, res: Response) => res.sendFile(index));
  }

  protected getWebAppMetadata(webAppPath: string): { dir: string; index: string } {
    if (!webAppPath) throw Error('Invalid webApps path provided');
    const reg = /\w*\.(html|php|hbs|ejs)$/;
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
        const routerInstance = importedRouter?.default
          ? importedRouter.default
          : getObjectValuesList(importedRouter)
            .find((rtr) => typeof rtr === 'function' && rtr && rtr.stack && rtr.stack[0] && rtr.stack[0].route);

        return routerInstance;
      })
      .filter((item) => !isEmpty(item));
  }

  protected setRequestHandlers<C extends GenericObject>(container: C, requestHandlers: C): C {
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

  protected initializeLoggerDependentSettings(): void {
    if (!this._settings.globalErrorHandler) this._settings.globalErrorHandler = createGlobalErrorHandler(this._settings.log);
    if (!this._settings.sendResponseHandler) this._settings.sendResponseHandler = createSendResponseHandler(this._settings.log);
  }

  /* eslint-disable-next-line */
  protected throwError(originalError: any, message: string): void {
    throw new Error(JSON.stringify({ message, originalError: originalError?.message }));
  }
}
