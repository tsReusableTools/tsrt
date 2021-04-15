/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response as Res } from 'express';
import stc from 'http-status';

import { msg, isEmpty, isNil, isEmptyNil, removeParams, parseTypes, isStream } from '@tsrt/utils';

export function createApiResponse(res: Res, config: Partial<IHttpError>): IApiResponse;
export function createApiResponse(res: Res, statusCode: number, body?: any): IApiResponse;
export function createApiResponse(res: Res, config: number | Partial<IHttpError>, body?: any): IApiResponse {
  const { originalUrl, method, query: originalQuery, params: originalParams, headers: { referer }, id } = res.req;
  const { reqId: reqIdLocals } = res.locals;

  const { status, statusText, data } = msg(config as number, body);
  const url = removeParams(originalUrl);
  const params = parseTypes(originalParams);
  const query = parseTypes(originalQuery);
  const reqId = id ?? reqIdLocals;

  const response: IApiResponse = { status, statusText, method, url, referer, reqId, params, query, data };
  if (isEmptyNil(params)) delete response.params;
  if (isEmpty(query)) delete response.query;
  if (isNil(referer)) delete response.referer;
  if (isNil(reqId)) delete response.reqId;
  if (status >= 400 && Array.isArray(data)) {
    delete response.data;
    response.errors = data;
  }

  return response;
}

/** Send Express response w/ IApiResponse interface */
export function send(res: Res, config: Partial<IHttpError>): Res<IApiResponse>;
export function send(res: Res, statusCode: number, body?: any): Res<IApiResponse>;
export function send(res: Res, config: number | Partial<IHttpError>, body?: any): Res<IApiResponse> {
  if (res.headersSent) return;
  const response = createApiResponse(res, config as number, body);
  return res.status(response.status).send(response);
}

send.ok = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.OK, body);
send.created = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.CREATED, body);

send.badRequest = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.BAD_REQUEST, body);
send.unAuthorized = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.UNAUTHORIZED, body);
send.forbidden = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.FORBIDDEN, body);
send.notFound = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.NOT_FOUND, body);
send.methodNotAllowed = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.METHOD_NOT_ALLOWED, body);
send.conflict = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.CONFLICT, body);

send.internalServerError = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.INTERNAL_SERVER_ERROR, body);
send.notImplemented = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.NOT_IMPLEMENTED, body);
send.badGateway = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.BAD_GATEWAY, body);
send.serviceUnavailable = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.SERVICE_UNAVAILABLE, body);
send.gatewayTimeout = (res: Res, body?: any): Res<IApiResponse> => send(res, stc.GATEWAY_TIMEOUT, body);

/** Checks whether provided value is valid ApiResponse like object */
send.isValid = (data: any): boolean => !!(data
  && typeof data === 'object'
  && Object.hasOwnProperty.call(data, 'status')
  && Object.hasOwnProperty.call(data, 'statusText')
  && Object.hasOwnProperty.call(data, 'method')
  && Object.hasOwnProperty.call(data, 'url')
  && Object.hasOwnProperty.call(data, 'data')
);

export function createLoggedSend(logger?: ISendLogger): (res: Res, data: any) => Res {
  return (res: Res, data: any): Res => {
    if (isStream(data)) return res.pipe(data);

    const response = (send.isValid(data) || msg.isValid(data))
      ? { status: data.status, data: data.data }
      : { status: res.statusCode, data };

    const logResponse = createApiResponse(res, response);
    if (typeof logger?.error === 'function' && logResponse.status >= 400) logger.error(logResponse);
    else if (typeof logger?.info === 'function') logger.info(logResponse);

    return send(res, response);
    // return res.send(data);
  };
}

export interface ISendLogger {
  debug(data: any, ...args: any[]): any;
  info(data: any, ...args: any[]): any;
  warn?(data: any, ...args: any[]): any;
  error(data: any, ...args: any[]): any;
}
