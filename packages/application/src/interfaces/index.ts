/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-unresolved
import { ApplicationRequestHandler } from 'express-serve-static-core';
import { Router, Application as ExpressApplication, RequestHandler, ErrorRequestHandler } from 'express';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';
import { IHelmetConfiguration } from 'helmet';

import { ISessionSettings } from '@tsrt/session';

export type IApplication = ExpressApplication;

export interface IApplicationSettings<T extends IApplication = IApplication> {
  /** Existing Express App. It will be used instead of creating new App by default. */
  app?: T;

  /** Custom application logger. It should implement at least 2 methods: `info` and `error`. */
  log?: IApplicationLogger;

  /** Whether to show debug info (logs). @default false */
  debug?: boolean;

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

  /**
   *  Default routers mount options. Key - value (Express Router instance) pairs.
   *  Key (path) - String value for router path.
   *  Value - Router instance or glob pattern from where to import.
   */
  mount?: ApplicationMountList;

  /** Register default middlewares here. */
  middlewares?: ApplicationMiddlewareList;

  /** Session options. @see https://www.npmjs.com/package/express-session */
  session?: IApplicationSession;

  /** Whether to use default controllers. They will be mounted under apiBase path(s). 2 controllers - server info and health check. */
  useDefaultControllers?: boolean;

  /** Middleware to be used instead of default `notFoundHandler` */
  notFoundHandler?: RequestHandler;

  /** Middleware to be used instead of default `sendResponseHandler` */
  sendResponseHandler?: RequestHandler;

  /** Middleware to be used instead of default `globalErrorHandler` */
  globalErrorHandler?: ErrorRequestHandler;
}

export interface IApplicationManualSetup {
  /** Proxy to native Express App `use` method */
  use: ApplicationRequestHandler<IApplicationManualSetup>;

  /** Proxy to native Express App `set` method */
  set(setting: string, value: any): this;

  /** Setups all middlewares and settings (which are used under this method) at once. */
  setupAll(): IApplicationManualSetup;

  /** Sets query parser for App. */
  setupQueryParser(cb?: (str: string) => any): IApplicationManualSetup;

  /** Sets default middlewares: cors, helmet, bodyparser, ... etc */
  setupDefaultExpressMiddlewares(): IApplicationManualSetup;

  /** Sets handler for attaching request id for each request. */
  setupRequestIdMiddleware(): IApplicationManualSetup;

  /** Sets session middleware. */
  setupSession(sessionConfig?: IApplicationSession): IApplicationManualSetup;

  /** Sets send response pathcer middleware (pathces `send` function before sending response). */
  setupSendResponseMiddleware(handler?: RequestHandler, paths?: TypeOrArrayOfTypes<string | RegExp>): IApplicationManualSetup;

  /** Sets statics. */
  setupStatics(statics?: ApplicationStatics): IApplicationManualSetup;

  /** Sets custom middlewares provide via `options` or via `addMiddlewares` method. */
  setupMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationManualSetup;

  /** Sets custom controllers (routes) provide via `options` or via `addRoutes` method. */
  setupRouter(mount: ApplicationMountList): IApplicationManualSetup;

  /** Sets notFoundHandler. */
  setupNotFoundHandler(handler?: RequestHandler): IApplicationManualSetup;

  /** Sets webApps statics and serving. */
  setupWebApps(webApps?: ApplicationWebApps): IApplicationManualSetup;

  /** Sets global request handler. */
  setupGlobalErrorHandler(handler?: ErrorRequestHandler): IApplicationManualSetup;

  /** Proxy to public Application `start` method */
  start(cb?: Callback): void;
}

export interface IApplicationInfo {
  dateTime: string;
  commit: string;
  version: string;
  env: string;
}

export interface IApplicationSession extends ISessionSettings {
  paths?: string | string[];
}

export interface IApplicationLogger {
  debug(data: any, ...args: any[]): any;
  info(data: any, ...args: any[]): any;
  warn(data: any, ...args: any[]): any;
  error(data: any, ...args: any[]): any;
}

export type ApplicationMount = string | Router;

export type ApplicationMountList = Record<string, TypeOrArrayOfTypes<ApplicationMount>>;

export type ApplicationMiddlewareList = Record<string, TypeOrArrayOfTypes<RequestHandler>>;

export type ApplicationStatics = string[] | Record<string, string>;

export type ApplicationWebApps = string | Record<string, string>;

export type ApplicationPaths = TypeOrArrayOfTypes<string>;

export type TypeOrArrayOfTypes<T> = T | T[];

/* eslint-disable-next-line */
export type Callback = (...args: any[]) => void;
