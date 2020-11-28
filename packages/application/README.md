# Typescript Reusable Tools: Application

Basic configurable Application built on top of awesome `express` framework.

## Usage

```ts
import { Application } from '@tsrt/application';

new Application({ port: 3001 }).start();
```

This will create Express App and listen 3001 port.

Under the hood it will register global error handler, not found page handler, reponse interseptor (to add metadata for each response).

### Use cases

For session it uses [express-session](https://www.npmjs.com/package/express-session).

The most basic use case:

```ts
const API = '/api/v1';

new Application({
  port: 3001,
  apiBase: API,
  webApps: path.join(__dirname, '../client'),
  session: {
    session: {
      name: 'name',
      secret: 'secret',
      expiration: 86400000,
      cookie: { domain: 'example.com' },
    },
    store: { url: 'redis_url', password: 'redis_password' },
  },
  middlewares: { [API]: [`${__dirname}/api/middlewares/**/*.ts`] },
  mount: { [API]: [`${__dirname}/api/controllers/**/*.ts`] },
}).start();
```

Routes, middlewares, session also couldbe provided via config. Along with others:

```ts

const middleware = (req, res, next) => { console.log('Hi'); next(); };
const middleware2 = (req, res, next) => { console.log('Hi 2'); next(); };

const router = Router();
const router2 = Router();
const router3 = Router();

router
  .post('/', (req, res) => { ... })
  .get('/:id?', (req, res) => { ... })
  .put('/:id', (req, res) => { ... })
  .delete('/:id', (req, res) => { ... })

router2
  .post('/', (req, res) => { ... })
  .get('/:id?', (req, res) => { ... })
  .put('/:id', (req, res) => { ... })
  .delete('/:id', (req, res) => { ... })

new Application({ port: 3001 })
  .addSession(expressSessionConfig)
  .addMiddlewares({
    '/': middleware, // Provide middleware for route.
    '/only': [middleware, middleware2], //  ... or list of middlewares.
  })
  .addRoutes({ 
    '/only': router3, // Provide router for route.
    '/rest/api': [router, router2], //  ... or list of routers.
    '/test': 'path/to/controllers/**/*.ts' // ... or glob to get routers
  })
  .start();
```

### Options

```ts
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


```
