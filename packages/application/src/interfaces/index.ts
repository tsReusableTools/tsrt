import { Router, Application as ExpressApplication, RequestHandler } from 'express';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';
import { IHelmetConfiguration } from 'helmet';

import { ISessionSettings } from '@tsrt/session';

export type IApplication = ExpressApplication;

export interface IApplicationSettings<T extends IApplication = IApplication> {
  /** Existing Express App. It will be used instead of creating new App by default. */
  app?: T;

  /** Port to listen. */
  port?: number | string;

  /** Base api path/pathes. This one is necessary for registering default notFound, globalError and other middlewares. */
  apiBase?: ApplicationPaths;

  /** List of statics dirs, or object w/ key - route path, and value - statics dir. */
  statics?: ApplicationStatics;

  /** Same as for static, but also for serving webApps. */
  webApps?: ApplicationWebApps;

  /** Cors options. @see https://www.npmjs.com/package/cors */
  cors?: CorsOptions;

  /** Query parser options. @see https://www.npmjs.com/package/qs */
  qs?: IParseOptions;

  /** Helmep options @see https://www.npmjs.com/package/helmet */
  helmet?: IHelmetConfiguration;

  /** Default routers mount options. As from example above. */
  mount?: ApplicationMountList;

  /** Whether to use default controllers. They will be mounted under apiBase path(s). 2 controllers - server info and health check. */
  useDefaultControllers?: boolean;

  /** Register default middlewares here. */
  middlewares?: ApplicationMiddlewareList;

  /** Session options. @see https://www.npmjs.com/package/express-session */
  session?: IApplicationSession;
}

export interface IApplicationConfig {
  /** Sets all middlewares (which are used under this method) at once. */
  setAllMiddlewares(): IApplicationConfig;

  /** Sets query parser for App. */
  setQueryParser(): IApplicationConfig;

  /** Sets default middlewares: cors, helmet, bodyparser, ... etc */
  setDefaultMiddlewares(): IApplicationConfig;

  /** Sets handler for attaching request id for each request. */
  setRequestIdMiddleware(): IApplicationConfig;

  /** Sets session middleware. */
  setSession(sessionConfig?: IApplicationSession): IApplicationConfig;

  /** Sets send response pathcer middleware (pathces `send` function before sending response). */
  setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): IApplicationConfig;

  /** Sets statics. */
  setStatics(statics?: ApplicationStatics): IApplicationConfig;

  /** Sets custom middlewares provide via `options` or via `addMiddlewares` method. */
  setMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationConfig;

  /** Sets custom controllers (routes) provide via `options` or via `addRoutes` method. */
  setRouter(mount: ApplicationMountList): IApplicationConfig;

  /** Sets notFoundHandler. */
  setNotFoundHandler(): IApplicationConfig;

  /** Sets webApps statics and serving. */
  setWebApps(webApps?: ApplicationWebApps): IApplicationConfig;

  /** Sets global request handler. */
  setGlobalErrorHandler(): IApplicationConfig;
}

export interface IApplicationInfo {
  dateTime: string;
  commit: string;
  version: string;
  instance: string;
}

export interface IApplicationSession extends ISessionSettings {
  paths?: string | string[];
}

export type ApplicationRouter = Router | string | { path: string | RegExp; router: Router | string };

export type ApplicationMount = string | Router;

export type ApplicationMountList = Record<string, TypeOrArrayOfTypes<ApplicationMount>>;

export type ApplicationMiddleware = RequestHandler | { path: string | RegExp; middleware: RequestHandler };

export type ApplicationMiddlewareList = Record<string, TypeOrArrayOfTypes<RequestHandler>>;

export type ApplicationStatics = string[] | Record<string, string>;

export type ApplicationWebApps = string | Record<string, string>;

export type ApplicationPaths = TypeOrArrayOfTypes<string>;

export type TypeOrArrayOfTypes<T> = T | T[];
