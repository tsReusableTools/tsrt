# Common TsED Application

[![npm version](https://img.shields.io/npm/v/@tsrt/tsed.svg)](https://www.npmjs.com/package/@tsrt/tsed) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/tsed.svg)](https://www.npmjs.com/package/@tsrt/tsed) [![Downloads](https://img.shields.io/npm/dm/@tsrt/tsed.svg)](https://www.npmjs.com/package/@tsrt/tsed)


Basic configurable Application built on top of awesome [TsED](https://v5.tsed.io/) framework.

All necessary/common middlewares and configs are setted by default under the hood w/ ability to rewrite/disable/enable them
using settings. 

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.

So prefer using exact version instead of version with `~` or `^`.

## Usage

```ts
import { Application } from '@tsrt/tsed';
import { Logger } from 'path/to/your/logger';

const port = 3333;
const apiBase = '/api/v1';
const log = new Logger();

new Application({
  port,
  apiBase,
  log,
  mount: {
    [apiBase]: `${__dirname}/controllers/**/*.ts`,
  },
  middlewares: {
    [apiBase]: [...],
  },
  statics: {
    '/assets': '...',
  },
  webApps: `${__dirname}/client/index.html`,
  ...
})
  .start(() => log.info(`Server started on port: ${port}. Pid: ${process.pid}'));
```

## API Reference

```ts
export declare class Application {
  settings: IApplicationSettings;

  /** Starts Application. */
  start(cb?: Callback): Promise<void>;

  /** Application middlewares/config manual setup (which is done by default under `start` method). */
  manualSetup(settings?: IApplicationManualSetupSettings): IApplicationManualSetup;
}

export interface IApplicationManualSetup extends IApplicationMethods {
  /** Proxy to native Express App `set` method */
  set(setting: string, value: any): this;

  /** Proxy to native Express App `use` method */
  use(...handlers: any[]): IApplicationManualSetup;

  /** Proxy to native Express App `use` method, w/ ability to use before one of `IApplicationMethods` methods. */
  useBefore(methodName: keyof IApplicationMethods, ...handlers: any[]): IApplicationManualSetup;

  /** Setups all middlewares and settings (which are used under this method) at once. */
  setupAll(): IApplicationManualSetup;

  /** Proxy to public Application `start` method */
  start(cb?: Callback): void;

  /** Sets query parser for App. */
  setupQueryParser(cb?: (str: string) => any): IApplicationManualSetup;

  /** Sets default middlewares: cors, helmet, bodyparser, ... etc */
  setupDefaultExpressMiddlewares(): IApplicationManualSetup;

  /** Sets handler for attaching request id for each request. */
  setupRequestIdMiddleware(): IApplicationManualSetup;

  /** Sets session middleware. */
  setupSession(sessionConfig?: IApplicationSession): IApplicationManualSetup;

  /** Sets send response pathcer middleware (pathces `send` function before sending response). */
  setupSendResponseHandler(handler?: IApplicationSendResponseHandler): IApplicationManualSetup;

  /** Sets custom middlewares provide via `options` or via `addMiddlewares` method. */
  setupMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationManualSetup;

  /** Sets notFoundHandler. */
  setupNotFoundHandler(handler?: RequestHandler): IApplicationManualSetup;

  /** Sets webApps statics and serving. */
  setupWebApps(webApps?: ApplicationWebApps): IApplicationManualSetup;

  /** Sets global request handler. */
  setupGlobalErrorHandler(handler?: ErrorRequestHandler): IApplicationManualSetup;
}

export interface IApplicationManualSetupSettings {
  /** Whether to use not called manually default methods. @default true. */
  useMethodsByDefault?: boolean;
}
```

## Settings (Declarative API reference)

```ts
export interface IApplicationSettings extends Partial<Configuration> {
  /** TsED swagger settings. For some reason TS comliper doesn't see it by default. */
  swagger?: SwaggerSettings | SwaggerSettings[];

  /** Custom application logger. It should implement at least 2 methods: `info` and `error`. */
  log?: IApplicationLogger;

  /** Whether to show debug info (logs). @default false */
  debug?: boolean;

  /** Port to listen. */
  port?: number | string;

  /** Base api path/pathes. This one is necessary for registering default notFound, globalError and other middlewares. */
  apiBase?: ApplicationPaths;

  /** List of statics dirs, or object w/ key - route path, and value - statics dir. */
  // statics?: ApplicationStatics;

  /** Same as for static, but also for serving webApps. */
  webApps?: ApplicationWebApps;

  /** Cors options. @see https://www.npmjs.com/package/cors */
  cors?: CorsOptions;

  /** Query parser options. @see https://www.npmjs.com/package/qs */
  qs?: IParseOptions;

  /** Helmep options @see https://www.npmjs.com/package/helmet */
  helmet?: IHelmetConfiguration;

  /** Register default middlewares here. */
  middlewares?: ApplicationMiddlewareList;

  /** Session options. @see https://www.npmjs.com/package/express-session */
  session?: IApplicationSession;

  /** Whether to use default controllers. They will be mounted under apiBase path(s). 2 controllers - server info and health check. */
  useDefaultControllers?: boolean;

  /** Middleware to be used instead of default `notFoundHandler` */
  notFoundHandler?: ApplicationMiddleware;

  /** Middleware to be used instead of default `globalErrorHandler` */
  globalErrorHandler?: ApplicationErrorMiddleware;

  /** Method to be used in `SendResponseMiddleware` of TsED. */
  sendResponseHandler?: IApplicationSendResponseHandler;

  /** Whether to set swagger api-docs for `apiBase` if only 1 string value provided for it. @default true. */
  setSwaggerForApiBaseByDefault?: boolean;

  /** Whether to patch TsED native BodyParams to allow provide additional options like `validationGroups`. @default true. */
  patchBodyParamsDecorator?: boolean;

  /**
   *  Whether to patch `class-validator` validators without groups and set `always: true` for them.
   *  This will allow to provide groups for some validators and they will be validated only for that groups,
   *  which should also be provided as `validationGroups` options for BodyParams decorator (if `patchBodyParamsDecorator: true`).
   *
   *  @default true.
   *
   *  @example
   *  ```ts
   *  class UpdateDto {
   *    @Property() @IsOptional({ groups: ['update'] }) @IsString() id: string;
   *    @Property() @IsString() name: string;
   *  }
   *
   *  class CreateDto extends UpdateDto {
   *    @Required() id: string;
   *  }
   *
   * @Get('/')
   * public async create(@BodyParams() body: CreateDto) { ... }
   *
   * public async update(@BodyParams({ validationGroups: ['update'] }) body: CreateDto) { ... }
   *  ```
   */
  patchValidatorsWithoutGroups?: boolean;

  /** Whether to parse types validating body. @default true. */
  parseBodyTypesAfterValidation?: boolean;

  /** Whether to parse types of server response. @default false. */
  parseResponseTypes?: boolean;

  /** `class-validator` options for validation pipe. @default { whitelist: true, forbidNonWhitelisted: true }. */
  validationOptions?: ValidatorOptions;

  /** List of TsED `ParamTypes` to validate in ValidationPipe. @default all. */
  validationParamTypes?: Array<ParamTypes | string>;
}

export interface IApplicationLogger {
  debug(data: any, ...args: any[]): any;
  info(data: any, ...args: any[]): any;
  warn(data: any, ...args: any[]): any;
  error(data: any, ...args: any[]): any;
}
```

## Plans

Planning to update to use TsED v6 under the hood.

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
