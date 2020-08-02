/* eslint-disable @typescript-eslint/no-explicit-any */
import stc from 'http-status';

import { msgAlias } from './types';

/** Creates msg w/ same interface as HttpError */
export function msg<T = any>(config: Partial<IHttpError<T>>): IHttpError<T>;
export function msg<T = any>(statusCode: number, customData?: T, customCode?: number | string): IHttpError<T>;
export function msg<T = any>(firstArg: number | Partial<IHttpError<T>>, customData?: T, customCode?: number | string): IHttpError<T> {
  const status = (firstArg && typeof firstArg === 'object' ? firstArg.status : firstArg as number) || stc.OK;
  const data = (firstArg && typeof firstArg === 'object' ? firstArg.data : customData) || (stc as GenericObject)[status];
  const code = (firstArg && typeof firstArg === 'object' ? firstArg.code : customCode);
  const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
  const statusText = (stc as GenericObject)[status];
  return { message, data, status, statusText, code };
}

msg.ok = ((data, code) => msg(stc.OK, data, code)) as msgAlias;
msg.created = ((data, code) => msg(stc.CREATED, data, code)) as msgAlias;

msg.badRequest = ((data, code) => msg(stc.BAD_REQUEST, data, code)) as msgAlias;
msg.unAuthorized = ((data, code) => msg(stc.UNAUTHORIZED, data, code)) as msgAlias;
msg.forbidden = ((data, code) => msg(stc.FORBIDDEN, data, code)) as msgAlias;
msg.notFound = ((data, code) => msg(stc.NOT_FOUND, data, code)) as msgAlias;
msg.methodNotAllowed = ((data, code) => msg(stc.METHOD_NOT_ALLOWED, data, code)) as msgAlias;
msg.conflict = ((data, code) => msg(stc.CONFLICT, data, code)) as msgAlias;

msg.internalServerError = ((data, code) => msg(stc.INTERNAL_SERVER_ERROR, data, code)) as msgAlias;
msg.notImplemented = ((data, code) => msg(stc.NOT_IMPLEMENTED, data, code)) as msgAlias;
msg.badGateway = ((data, code) => msg(stc.BAD_GATEWAY, data, code)) as msgAlias;
msg.serviceUnavailable = ((data, code) => msg(stc.SERVICE_UNAVAILABLE, data, code)) as msgAlias;
msg.gatewayTimeout = ((data, code) => msg(stc.GATEWAY_TIMEOUT, data, code)) as msgAlias;

/** Checks whether provided value is valid HttpError like object */
msg.isValidConfig = (data: any): boolean => !!(data
  && Object.hasOwnProperty.call(data, 'status')
  && Object.hasOwnProperty.call(data, 'data')
  // && Object.hasOwnProperty.call(data, 'code')
  // && Object.hasOwnProperty.call(data, 'message')
  // && Object.hasOwnProperty.call(data, 'statusText')
);

// msg.ok = <T = any>(data?: T): IHttpError<T> => msg(stc.OK, data);
// msg.created = <T = any>(data?: T): IHttpError<T> => msg(stc.CREATED, data);

// msg.badRequest = <T = any>(data?: T): IHttpError<T> => msg(stc.BAD_REQUEST, data);
// msg.unAuthorized = <T = any>(data?: T): IHttpError<T> => msg(stc.UNAUTHORIZED, data);
// msg.forbidden = <T = any>(data?: T): IHttpError<T> => msg(stc.FORBIDDEN, data);
// msg.notFound = <T = any>(data?: T, code?: any): IHttpError<T> => msg(stc.NOT_FOUND, data);
// msg.methodNotAllowed = <T = any>(data?: T): IHttpError<T> => msg(stc.METHOD_NOT_ALLOWED, data);
// msg.conflict = <T = any>(data?: T): IHttpError<T> => msg(stc.CONFLICT, data);
//
// msg.internalServerError = <T = any>(data?: T): IHttpError<T> => msg(stc.INTERNAL_SERVER_ERROR, data);
// msg.notImplemented = <T = any>(data?: T): IHttpError<T> => msg(stc.NOT_IMPLEMENTED, data);
// msg.badGateway = <T = any>(data?: T): IHttpError<T> => msg(stc.BAD_GATEWAY, data);
// msg.serviceUnavailable = <T = any>(data?: T): IHttpError<T> => msg(stc.SERVICE_UNAVAILABLE, data);
// msg.gatewayTimeout = <T = any>(data?: T): IHttpError<T> => msg(stc.GATEWAY_TIMEOUT, data);

// export function msg<T = any>(
//   statusCode: number | Partial<IHttpError<T>> = stc.OK,
//   customData: T = (typeof statusCode === 'number' ? (stc as GenericObject)[statusCode] : stc['200']) || stc['200'],
// ): IHttpError<T> {
//   const status = typeof statusCode === 'number' ? statusCode : (statusCode.status || stc.OK);
//   const data = typeof statusCode === 'object' ? statusCode.data : customData;
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//   return { message, data, status, statusText };
// }

// export function msg<T = any>(customData: T | Partial<IHttpError<T>> = stc['200'] as any, statusCode: number = stc.OK): IHttpError<T> {
//   const status = 'status' in customData && customData.status ? customData.status : (statusCode || stc.OK);
//   const data: T = 'data' in customData && customData.data ? customData.data as T : customData as T;
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//   return { message, data, status, statusText };
// }

// export function msg<T = any>(
//   statusCode: number | Partial<IHttpError<T>> = stc.OK,
//   customData: T | Partial<IHttpError<T>> = stc['200'] as any,
// ): IHttpError<T> {
//   let status: number = typeof statusCode === 'number' ? statusCode : stc.OK;
//   let data: T = customData as T;
//
//   if (typeof statusCode === 'object') {
//     status = statusCode.status || stc.OK;
//     data = statusCode.data;
//   }
//
//   if ('status' in customData) status = customData.status || stc.OK;
//   if ('data' in customData) data = customData.data || (stc as GenericObject)[status];
//
//   if (data === null || data === undefined) data = (stc as GenericObject)[status];
//
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//
//   return { message, data, status, statusText };
// }
