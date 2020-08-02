/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import stc from 'http-status';

/** Class for Http Error w/ details: status, data, data, statusText */
export class HttpError<T = any> extends Error implements IHttpError {
  public message: string;
  public data: any;
  public status: number;
  public statusText: string;
  public code?: number | string;

  constructor(config: Partial<IHttpError<T>>);
  constructor(statusCode: number, customData?: T, customCode?: number | string);
  constructor(firstArg: number | Partial<IHttpError<T>>, customData?: T, customCode?: number | string) {
    const status = (firstArg && typeof firstArg === 'object' ? firstArg.status : firstArg as number) || stc.OK;
    const data = (firstArg && typeof firstArg === 'object' ? firstArg.data : customData) || (stc as GenericObject)[status];
    const code = (firstArg && typeof firstArg === 'object' ? firstArg.code : customCode);
    const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
    const statusText = (stc as GenericObject)[status];

    super(message);

    this.message = message;
    this.data = data;
    this.status = status;
    this.statusText = statusText;
    this.code = code;
  }
}

/** Throws http error, w/ useful alias methods */
export function throwHttpError<T = any>(config: Partial<IHttpError<T>>): void;
export function throwHttpError<T = any>(statusCode: number, customData?: T, customCode?: number | string): void;
export function throwHttpError<T = any>(firstArg: number | Partial<IHttpError<T>>, customData?: T, customCode?: number | string): void {
  throw new HttpError(firstArg as number, customData, customCode);
}

throwHttpError.badRequest = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.BAD_REQUEST, data, code);
throwHttpError.unAuthorized = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.UNAUTHORIZED, data, code);
throwHttpError.forbidden = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.FORBIDDEN, data, code);
throwHttpError.notFound = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.NOT_FOUND, data, code);
throwHttpError.methodNotAllowed = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.METHOD_NOT_ALLOWED, data, code);
throwHttpError.conflict = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.CONFLICT, data, code);

throwHttpError.internalServerError = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.INTERNAL_SERVER_ERROR, data, code);
throwHttpError.notImplemented = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.NOT_IMPLEMENTED, data, code);
throwHttpError.badGateway = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.BAD_GATEWAY, data, code);
throwHttpError.serviceUnavailable = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.SERVICE_UNAVAILABLE, data, code);
throwHttpError.gatewayTimeout = <T = any>(data?: T, code?: number | string): void => throwHttpError(stc.GATEWAY_TIMEOUT, data, code);

// constructor(
//   statusCode: number | Partial<IHttpError<T>> = stc.INTERNAL_SERVER_ERROR,
//   customData: T = (typeof statusCode === 'number' ? (stc as GenericObject)[statusCode] : stc['500']) || stc['500'],
// ) {
//   const status = typeof statusCode === 'number' ? statusCode : (statusCode.status || stc.OK);
//   const data = typeof statusCode === 'object' ? statusCode.data : customData;
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//
//   super(message);
//
//   this.message = message;
//   this.data = data;
//   this.status = status;
//   this.statusText = statusText;
// }
