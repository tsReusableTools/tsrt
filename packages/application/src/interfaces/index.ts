import { Router, Application as ExpressApplication, RequestHandler } from 'express';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';
import { IHelmetConfiguration } from 'helmet';

import { ISessionSettings } from '@tsrt/session';

export type IApplication = ExpressApplication;

export interface IApplicationSettings<T extends IApplication = IApplication> {
  app?: T;
  port?: number | string;
  apiBase?: ApplicationPaths;
  statics?: ApplicationStatics;
  webApps?: ApplicationWebApps;
  cors?: CorsOptions;
  qs?: IParseOptions;
  helmet?: IHelmetConfiguration;
  mount?: ApplicationMountList;
  useDefaultControllers?: boolean;
  middlewares?: ApplicationMiddlewareList;
  session?: IApplicationSession;
}

export interface IApplicationConfig {
  setAllMiddlewares(): IApplicationConfig;
  setQueryParser(): IApplicationConfig;
  setDefaultMiddlewares(): IApplicationConfig;
  setRequestIdMiddleware(): IApplicationConfig;
  setSession(sessionConfig?: IApplicationSession): IApplicationConfig;
  setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): IApplicationConfig;
  setStatics(statics?: ApplicationStatics): IApplicationConfig;
  setMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationConfig;
  setRouter(mount: ApplicationMountList): IApplicationConfig;
  setNotFoundHandler(): IApplicationConfig;
  setWebApps(webApps?: ApplicationWebApps): IApplicationConfig;
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
