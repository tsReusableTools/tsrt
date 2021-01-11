# Typescript Reusable Tools: Application

[![npm version](https://img.shields.io/npm/v/@tsrt/application.svg)](https://www.npmjs.com/package/@tsrt/application) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/application.svg)](https://www.npmjs.com/package/@tsrt/application) [![Downloads](https://img.shields.io/npm/dm/@tsrt/application.svg)](https://www.npmjs.com/package/@tsrt/application)


Basic configurable Application built on top of awesome [Express](https://expressjs.com/) framework.

All necessary/common middlewares and configs are setted by default under the hood w/ ability to rewrite/disable/enable them
using settings. 

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.

So prefer using exact version instead of version with `~` or `^`.

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
  logger: new Logger(), // or just logger: console,
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
  middlewares: { [API]: [someMiddleware, someMiddleware2], '/test': someMiddleware3 }, // Or .addMiddlewares(...)
  mount: { [API]: [`${__dirname}/api/controllers/**/*.ts`], [API_v2]: someRouter }, // Or .addRouters(...)
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

### Advice

As known when throwing exeption in Express route, if handler is an `async` function that exeption would not be correctly passed to next route, so it is necessary to make it expicitly:

```ts
import { Router } from 'express';

// Incorrect
Router().get('/incorrect', async (req, res) => {
  throw new Error('Error'); // This will cause an unhandled exception.
  // Note, that it will work correctly, if handler is not an `async`.
  res.send('Error');
});

// Note, same example will work correctly, if handler is not an `async`.
Router().get('/incorrect', (req, res) => {
  throw new Error('Error');
  res.send('Error');
});

// Correct
Router().get('/correct', async (req, res) => {
  next(throw new Error('Error'));
  res.send('Error');
});
```

In order to have ability to throw exceptions without calling next, or if some another method threw an exception, we can patch Express w/ help of [express-async-errors](https://www.npmjs.com/package/express-async-errors).

```ts
import express from 'express';
require('express-async-errors'); // Should be used before any express usage.

// ... later in router
import { Router } from 'express';

// Incorrect
Router().get('/incorrect', async (req, res) => {
  throw new Error('Error'); // Now this will correctly path error to ErrorRequestHandler.
  res.send('Error');
});
```

### API reference

```ts
export declare class Application<T extends IApplication = IApplication> {
  constructor(settings?: IApplicationSettings<T>, app?: T);

  /** Current Express Application. */
  app: T;

  /** Application settings. */
  settings: IApplicationSettings<T>;

  /** Add aditional routers (mount) imperatively (also could be done declaratively via settings). */
  addRoutes(mount: ApplicationMountList): Application;

  /** Add aditional middlewares imperatively (also could be done declaratively via settings). */
  addMiddlewares(middlewares: ApplicationMiddlewareList): Application;

  /** Set session middleware imperatively (also could be done declaratively via settings) or just as regular middleware. */
  addSession(sessionConfig: IApplicationSession): Application;

  /** Reassign default sendResponseHandler (also could be done declaratively via settings). */
  setSendResponseHandler(handler: RequestHandler): Application;

  /** Reassign default notFoundHandler (also could be done declaratively via settings). */
  setNotFoundHandler(handler: RequestHandler): Application;

  /** Reassign default globalErrorHandler (also could be done declaratively via settings). */
  setGlobalErrorHandler(handler: ErrorRequestHandler): Application;

  /** Start Application. */
  start(cb?: Callback): void;

  /** Here it is possible to call every setup methods in necessary order. */
  manualSetup(settings?: IApplicationManualSetupSettings): IApplicationManualSetup;
}
```

### Options

```ts
export type IApplication = ExpressApplication;

export interface IApplicationSettings<T extends IApplication = IApplication> {
  /** Existing Express App. It will be used instead of creating new App by default. */
  app?: T;

  /** Custom application logger. It should implement at least 2 methods: `info` and `error`. */
  logger?: IApplicationLogger;

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
  setupSendResponseHandler(paths?: TypeOrArrayOfTypes<string | RegExp>): IApplicationManualSetup;

  /** Sets statics. */
  setupStatics(statics?: ApplicationStatics): IApplicationManualSetup;

  /** Sets custom middlewares provide via `options` or via `addMiddlewares` method. */
  setupMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationManualSetup;

  /** Sets custom controllers (routes) provide via `options` or via `addRoutes` method. */
  setupRouter(mount: ApplicationMountList): IApplicationManualSetup;

  /** Sets notFoundHandler. */
  setupNotFoundHandler(): IApplicationManualSetup;

  /** Sets webApps statics and serving. */
  setupWebApps(webApps?: ApplicationWebApps): IApplicationManualSetup;

  /** Sets global request handler. */
  setupGlobalErrorHandler(): IApplicationManualSetup;

  /** Proxy to public Application `start` method */
  start(cb?: Callback): void;
}

export interface IApplicationSession extends ISessionSettings {
  paths?: string | string[];
}

export interface IApplicationManualSetupSettings {
  useMethodsByDefault?: boolean;
}

export type ApplicationMount = string | Router;

export type ApplicationMountList = Record<string, TypeOrArrayOfTypes<ApplicationMount>>;

export type ApplicationMiddlewareList = Record<string, TypeOrArrayOfTypes<RequestHandler>>;

export type ApplicationStatics = string[] | Record<string, string>;

export type ApplicationWebApps = string | Record<string, string>;

export type ApplicationPaths = TypeOrArrayOfTypes<string>;

export type TypeOrArrayOfTypes<T> = T | T[];

export type Callback = (...args: any[]) => void;

```

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
