/* eslint-disable import/no-extraneous-dependencies */
import { LeveledLogMethod, LogCallback, Logger } from 'winston';
import '@ts-utils/types';

export interface ISubstring {
  start?: number;
  length?: number;
  end?: number;
}

/** Interface for item, which could be reordered */
export interface IOrderedItem extends GenericObject {
  id: number;
  order: number;
}

/** Interface Swagger config */
export interface ISwaggerConfig {
  swagger: string;
  info: {
    description: string;
    version: string;
    title: string;
    contact: {
      email: string;
    };
  };
  host: string;
  basePath: string;
  schemes: string[];
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: GenericObject;
  definitions: GenericObject;
}

/** Interface for swagger docs responses config */
export interface ISwaggerResponsesConfig {
  url: string;
  title?: string;
  method?: string;
  multipleDb?: boolean;
  ok?: GenericAny;
  created?: GenericAny;
  badRequest?: GenericAny;
  unAuthorized?: GenericAny;
  forbidden?: GenericAny;
  notFound?: GenericAny;
  conflict?: GenericAny;
  internalServerError?: GenericAny;
  badGateway?: GenericAny;
  gatewayTimeout?: GenericAny;

  200?: GenericAny;
  201?: GenericAny;
  400?: GenericAny;
  401?: GenericAny;
  403?: GenericAny;
  404?: GenericAny;
  409?: GenericAny;
  500?: GenericAny;
  502?: GenericAny;
  504?: GenericAny;
}

/** Interface for typical swagger docs response schema */
export interface ISwaggerResponseSchema {
  type: string;
  properties: {
    status: { type: string; format: string };
    statusText: { type: string };
    requestFrom: { type: string };
    method: { type: string };
    endPoint: { type: string };
    params?: { type: string; properties: { someQuery: { type: string } } };
    data: GenericAny;
  };
  required: ['status', 'statusText', 'requestFrom', 'method', 'endPoint'];
}

/** Interface for typical swagger docs response example */
export interface ISwaggerResponseExample {
  example: IMsg;
}

/** Interface for typical swagger docs response (description + schema + example) */
export interface ISwaggerResponse {
  [x: number]: {
    description: string;
    schema: ISwaggerResponseSchema & ISwaggerResponseExample;
  };
}

/** Interface for typical swagger docs param */
export interface ISwaggerParam {
  description: string;
  name: string;
  schema: GenericObject;
  required: boolean;
  in: string;
}

/** Interface for common get all records API */
export interface ISwaggerApiResponse {
  [x: string]: {
    tags: string[];
    summary: string;
    operationId: string;
    parameters: ISwaggerParam[];
    responses: ISwaggerResponse;
  };
}

/** Interface for custom winston logger log method */
export interface ICustomLogger extends LeveledLogMethod {
  (message: string, callback: LogCallback): Logger;
  (message: string, meta: unknown, callback: LogCallback): Logger;
  (message: unknown, ...meta: unknown[]): Logger;
  (infoObject: object): Logger;
}

/** Interface for custom winston logger */
export interface ILogger {
  info: ICustomLogger;
  error: ICustomLogger;
  warn: ICustomLogger;
  debug: ICustomLogger;
  verbose: ICustomLogger;
}
