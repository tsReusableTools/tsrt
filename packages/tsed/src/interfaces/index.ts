/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, RequestHandler, ErrorRequestHandler } from 'express';
import { ParamTypes } from '@tsed/common';
import { Configuration } from '@tsed/di';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';
import { IHelmetConfiguration } from 'helmet';
import { ValidatorOptions } from 'class-validator';
import { ClassTransformOptions } from 'class-transformer';

import { ISessionSettings } from '@tsrt/session';

export interface IApplicationSettings extends Partial<Configuration> {
  /** Custom application logger. It should implement at least 2 methods: `info` and `error`. */
  log?: IApplicationLogger;

  /**
   *  Debug mode.
   *
   *  @enum - TsED: full debug + TsED full debug.
   *  @enum - Application: Only debug for server start (hooks/middlewares iitialization).
   */
  debugMode?: 'TsED' | 'Application';

  /** Port to listen. */
  port?: number | string;

  /** Base api path/pathes. This one is necessary for registering default notFound, globalError and other middlewares. */
  apiBase?: ApplicationPaths;

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

  /** Method to be used in as responseFilter of TsED. Should implement `ResponseFilterMethods` interface. */
  sendResponseHandler?: Constructor;

  /** Whether to set swagger api-docs for `apiBase` if only 1 string value provided for it. @default false. */
  setSwaggerForApiBaseByDefault?: boolean;

  // /** Whether to patch TsED native BodyParams to allow provide additional options like `validationGroups`. @default true. */
  // patchBodyParamsDecorator?: boolean;

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

  /** `class-transformer` options for `DeserializerPipe`. */
  deserializerOptions?: ClassTransformOptions;
}

export interface IApplicationPrivateSettings extends IApplicationSettings {
  manuallyCalledMethodsOrder: ApplicationManuallyCalledMethod[];
  loggedSend?: (res: Response, data: any) => Response;
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
}

export interface IApplicationMethods {
  /** Sets query parser for App. */
  setupQueryParser(cb?: (str: string) => any): IApplicationManualSetup;

  /** Sets default middlewares: cors, helmet, bodyparser, ... etc */
  setupDefaultExpressMiddlewares(): IApplicationManualSetup;

  /** Sets handler for attaching request id for each request. */
  setupRequestIdMiddleware(): IApplicationManualSetup;

  /** Sets session middleware. */
  setupSession(sessionConfig?: IApplicationSession): IApplicationManualSetup;

  /** Sets send response pathcer middleware (pathces `send` function before sending response). */
  setupSendResponseHandler(handler?: Constructor): IApplicationManualSetup;

  /** Sets statics. */
  // setupStatics(statics?: ApplicationStatics): IApplicationManualSetup;

  /** Sets custom middlewares provide via `options` or via `addMiddlewares` method. */
  setupMiddlewares(middlewares?: ApplicationMiddlewareList): IApplicationManualSetup;

  /** Sets notFoundHandler. */
  setupNotFoundHandler(handler?: RequestHandler): IApplicationManualSetup;

  /** Sets webApps statics and serving. */
  setupWebApps(webApps?: ApplicationWebApps): IApplicationManualSetup;

  /** Sets global request handler. */
  setupGlobalErrorHandler(handler?: ErrorRequestHandler): IApplicationManualSetup;
}

export type ApplicationManuallyCalledMethod = keyof IApplicationMethods | ['set' | 'use', ...any[]];

export interface IApplicationManualSetupSettings {
  /** Whether to use not called manually default methods. @default true. */
  useMethodsByDefault?: boolean;
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

export type ApplicationMiddlewareList = Record<string, TypeOrArrayOfTypes<ApplicationMiddleware>>;

// export type ApplicationMiddleware = RequestHandler | { use(req: Req, res: Res, next: Next): Response | void };
export type ApplicationMiddleware = RequestHandler | Constructor;

export type ApplicationErrorMiddleware = ErrorRequestHandler | Constructor;

export type ApplicationStatics = string[] | Record<string, string>;

export type ApplicationWebApps = string | Record<string, string>;

export type ApplicationPaths = TypeOrArrayOfTypes<string>;

export type TypeOrArrayOfTypes<T> = T | T[];

/* eslint-disable-next-line */
export type Callback = (...args: any[]) => void;
