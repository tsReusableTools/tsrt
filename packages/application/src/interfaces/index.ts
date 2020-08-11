import { Router, Application as ExpressApplication } from 'express';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';
import { IHelmetConfiguration } from 'helmet';

export type IApplication = ExpressApplication;

export interface IApplicationSettings<T extends IApplication = IApplication> {
  app?: T;
  port?: number;
  apiBase?: ApplicationPaths;
  statics?: ApplicationStatics;
  webApps?: ApplicationWebApps;
  cors?: CorsOptions;
  qs?: IParseOptions;
  helmet?: IHelmetConfiguration;
  routers?: ApplicationRouters;
}

export interface IApplicationConfig {
  setAllMiddlewares(): void;
  setQueryParser(): void;
  setDefaultMiddlewares(): void;
  setRequestIdMiddleware(): void;
  setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): void;
  setStatics(statics?: ApplicationStatics): void;
  setRouter(routers?: ApplicationRouters): void;
  setNotFoundHandler(): void;
  setWebApps(webApps?: ApplicationWebApps): void;
  setGlobalErrorHandler(): void;
}

export type ApplicationRouters = ApplicationRouter[];

export type ApplicationRouter = Router | string | { path: string | RegExp; router: Router | string };

export type ApplicationStatics = string[] | Record<string, string>;

export type ApplicationWebApps = string | Record<string, string>;

export type ApplicationPaths = TypeOrArrayOfTypes<string>;

export type TypeOrArrayOfTypes<T> = T | T[];

/* eslint-disable @typescript-eslint/interface-name-prefix */
/* eslint-disable-next-line */
export namespace TsDApplication {
  export type App = ExpressApplication;

  export interface Settings<T extends App = App> {
    app?: T;
    port?: number;
    apiBase?: Paths;
    statics?: Statics;
    webApps?: WebApps;
    cors?: CorsOptions;
    qs?: IParseOptions;
    helmet?: IHelmetConfiguration;
    routers?: Routers;
  }

  export interface Config {
    setAllMiddlewares(): void;
    setQueryParser(): void;
    setDefaultMiddlewares(): void;
    setRequestIdMiddleware(): void;
    setSendResponseMiddleware(paths?: TypeOrArrayOfTypes<string | RegExp>): void;
    setStatics(statics?: ApplicationStatics): void;
    setRouter(routers?: ApplicationRouters): void;
    setNotFoundHandler(): void;
    setWebApps(webApps?: ApplicationWebApps): void;
    setGlobalErrorHandler(): void;
  }

  export type Routers = Array<Router | { path: string | RegExp; router: Router }>;

  export type Statics = string[] | Record<string, string>;

  export type WebApps = string | Record<string, string>;

  export type Paths = string | string[];
}
