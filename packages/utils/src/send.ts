/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import { Request as Req, Response as Res } from 'express';
import stc from 'http-status';

import { removeParams, isEmpty } from './utils';
import { msg } from './msg';
import { log } from './log';

/** Send Express response w/ IApiResponse interface */
export function send(req: Req, res: Res, config: Partial<IHttpError>): Res<IApiResponse>;
export function send(req: Req, res: Res, statusCode: number, body?: any): Res<IApiResponse>;
export function send(req: Req, res: Res, firstArg: number | Partial<IHttpError>, secondArg?: any): Res<IApiResponse> {
  const { originalUrl, method, query: params, headers: { referer } } = req;

  const { status, statusText, data } = msg(firstArg as number, secondArg);
  const requestFrom = referer;
  const endPoint = removeParams(originalUrl);

  const response: IApiResponse = { status, statusText, requestFrom, method, endPoint, params, data };
  if (!params || isEmpty(params)) delete response.params;

  if (response.status >= 400) log.error(response);
  else log.info(response);

  if (!res.headersSent) return res.status(response.status).send(response);
}

send.ok = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.OK, body);
send.created = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.CREATED, body);

send.badRequest = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.BAD_REQUEST, body);
send.unAuthorized = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.UNAUTHORIZED, body);
send.forbidden = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.FORBIDDEN, body);
send.notFound = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.NOT_FOUND, body);
send.methodNotAllowed = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.METHOD_NOT_ALLOWED, body);
send.conflict = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.CONFLICT, body);

send.internalServerError = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.INTERNAL_SERVER_ERROR, body);
send.notImplemented = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.NOT_IMPLEMENTED, body);
send.badGateway = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.BAD_GATEWAY, body);
send.serviceUnavailable = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.SERVICE_UNAVAILABLE, body);
send.gatewayTimeout = (req: Req, res: Res, body?: any): Res<IApiResponse> => send(req, res, stc.GATEWAY_TIMEOUT, body);
