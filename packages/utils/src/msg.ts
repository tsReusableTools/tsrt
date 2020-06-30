import stc from 'http-status';

import { isEmpty } from './utils';

/** Creates basic note with default status (200) and statusText (Ok) */
export const note = <T = string>(
  status: number = stc.OK, data?: T, endPoint?: string,
  method?: string, requestFrom?: string, params?: GenericObject,
  text?: string,
): IMsg<T> => {
  const statusText = text || (stc as GenericObject)[status];

  const response: IMsg = { status, statusText };

  if (requestFrom) response.requestFrom = requestFrom;
  if (method) response.method = method.toUpperCase();
  if (endPoint) response.endPoint = endPoint;
  if (params && !isEmpty(params)) response.params = params;

  if (!data && (data as GenericAny) !== false && (data as GenericAny) !== 0) {
    response.data = (stc as GenericObject)[status];
  } else if ((data as GenericAny) === false || (data as GenericAny) === 0) {
    response.data = data;
  } else if (data && typeof data === 'object' && !isEmpty(data)) {
    response.data = data;
  } else if (data && typeof data !== 'object') {
    response.data = data;
  } else if (Array.isArray(data)) {
    response.data = data;
  }

  return response;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Holds common msg methods */
export const msg = {
  /** Alias for note with custom status, data, etc... */
  note,

  /** Alias for msg with OK (200) status */
  ok: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.OK, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with CREATED (201) status */
  created: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.CREATED, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with BAD_REQUEST (400) status */
  badRequest: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.BAD_REQUEST, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with UNAUTHORIZED (401) status */
  unAuthorized: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.UNAUTHORIZED, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with FORBIDDEN (403) status */
  forbidden: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.FORBIDDEN, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with CONFLICT (409) status */
  conflict: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.CONFLICT, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with NOT_FOUND (404) status */
  notFound: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.NOT_FOUND, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with METHOD_NOT_ALLOWED (405) status */
  notAllowed: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.METHOD_NOT_ALLOWED, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with INTERNAL_SERVER_ERROR (500) status */
  internalServerError: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.INTERNAL_SERVER_ERROR, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with NOT_IMPLEMENTED (501) status */
  notImplemented: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.NOT_IMPLEMENTED, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with BAD_GATEWAY (502) status */
  badGateway: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.BAD_GATEWAY, data, endPoint, method, requestFrom, params, text),

  /** Alias for msg with GATEWAY_TIMEOUT (504) status */
  gatewayTimeout: <T = string>(
    data?: T, endPoint?: string,
    method?: string, requestFrom?: string, params?: GenericObject,
    text?: string,
  ): IMsg<T> => note(stc.GATEWAY_TIMEOUT, data, endPoint, method, requestFrom, params, text),
};
