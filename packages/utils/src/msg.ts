/* eslint-disable @typescript-eslint/no-explicit-any */
import stc from 'http-status';

import { msgAlias } from './types';
import { isNil } from './objectUtils';

const isValid = (data: any): boolean => !!(data
  && typeof data === 'object'
  && Object.hasOwnProperty.call(data, 'message')
  && Object.hasOwnProperty.call(data, 'data')
  && Object.hasOwnProperty.call(data, 'status')
  && Object.hasOwnProperty.call(data, 'statusText')
  && Object.hasOwnProperty.call(data, 'code')
  && Object.hasOwnProperty.call(data, '_isValid')
  && data._isValid
);

/** Creates msg w/ same interface as HttpError */
export function msg<T = any>(config: Partial<IHttpError<T>>): IHttpError<T>;
export function msg<T = any>(statusCode: number, body?: T, customCode?: number | string): IHttpError<T>;
export function msg<T = any>(config: number | Partial<IHttpError<T>>, body?: T, customCode?: number | string): IHttpError<T> {
  const status = (config && typeof config === 'object' ? config.status : config as number) || stc.OK;
  const statusText = (stc as GenericObject)[status];
  const data = (config && typeof config === 'object' ? config.data : body) || statusText;
  const code = (config && typeof config === 'object' ? config.code : customCode);
  let _isValid = config && typeof config === 'object' ? config._isValid : true;
  if (isNil(_isValid)) _isValid = true;
  let message = typeof data === 'string' ? data : statusText;
  if (config && typeof config === 'object' && config.message) message = config.message;
  return { message, data, status, statusText, code, _isValid };
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
msg.isValid = isValid;

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
//   body: T = (typeof statusCode === 'number' ? (stc as GenericObject)[statusCode] : stc['200']) || stc['200'],
// ): IHttpError<T> {
//   const status = typeof statusCode === 'number' ? statusCode : (statusCode.status || stc.OK);
//   const data = typeof statusCode === 'object' ? statusCode.data : body;
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//   return { message, data, status, statusText };
// }

// export function msg<T = any>(body: T | Partial<IHttpError<T>> = stc['200'] as any, statusCode: number = stc.OK): IHttpError<T> {
//   const status = 'status' in body && body.status ? body.status : (statusCode || stc.OK);
//   const data: T = 'data' in body && body.data ? body.data as T : body as T;
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//   return { message, data, status, statusText };
// }

// let status = (isValid(config) && typeof config === 'object' ? config.status : config as number) || stc.OK;
// if (typeof status !== 'number') status = stc.OK;
// const data = (isValid(config) && typeof config === 'object' ? config.data : body) || (stc as GenericObject)[status];
// const code = (isValid(config) && typeof config === 'object' ? config.code : customCode);
// const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
// const statusText = (stc as GenericObject)[status];

// export function msg<T = any>(
//   statusCode: number | Partial<IHttpError<T>> = stc.OK,
//   body: T | Partial<IHttpError<T>> = stc['200'] as any,
// ): IHttpError<T> {
//   let status: number = typeof statusCode === 'number' ? statusCode : stc.OK;
//   let data: T = body as T;
//
//   if (typeof statusCode === 'object') {
//     status = statusCode.status || stc.OK;
//     data = statusCode.data;
//   }
//
//   if ('status' in body) status = body.status || stc.OK;
//   if ('data' in body) data = body.data || (stc as GenericObject)[status];
//
//   if (data === null || data === undefined) data = (stc as GenericObject)[status];
//
//   const message = typeof data === 'string' ? data : (stc as GenericObject)[status];
//   const statusText = (stc as GenericObject)[status];
//
//   return { message, data, status, statusText };
// }
