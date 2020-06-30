/* eslint-disable import/no-extraneous-dependencies */
import { Request, Response } from 'express';
import stc from 'http-status';

import { removeParams } from './utils';
import { note } from './msg';
import { log } from './log';

/** Creates basic server response with default status (200) and statusText (Ok) */
export const respond = <T = string>(
  req: Request, res: Response, data?: T, status?: number, text?: string,
): Response => {
  const { originalUrl, method, headers, query } = req;
  const { referer } = headers;

  const responseUrl = removeParams(originalUrl);

  const response = (
    data && typeof data === 'object' && (data as GenericObject).status
    && ((data as GenericObject).data || (data as GenericObject).statusText)
  )
    ? note(
      status || (data as GenericObject).status, (data as GenericObject).data,
      responseUrl, method, referer, query, text,
    )
    : note(status || stc.OK, data, responseUrl, method, referer, query, text);

  if (response.status >= 400) log.error(response);
  else log.info(response);

  // if (realStatus >= 400) console.error('[ERROR]: \n', response);
  // else console.info('[INFO]: \n', response);

  if (!res.headersSent) return res.status(response.status).send(response);
};

/** Holds basic server response methods */
export const send = {
  /** Alias for response with custom status, data, etc... */
  msg: respond,

  /** Alias for response with OK (200) status */
  ok<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.OK);
  },

  /** Alias for response with CREATED (201) status */
  created<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.CREATED);
  },

  /** Alias for response with BAD_REQUEST (400) status */
  badRequest<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.BAD_REQUEST);
  },

  /** Alias for response with UNAUTHORIZED (401) status */
  unAuthorized<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.UNAUTHORIZED);
  },

  /** Alias for response with FORBIDDEN (403) status */
  forbidden<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.FORBIDDEN);
  },

  /** Alias for response with CONFLICT (409) status */
  conflict<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.CONFLICT);
  },

  /** Alias for response with NOT_FOUND (404) status */
  notFound<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.NOT_FOUND);
  },

  /** Alias for response with METHOD_NOT_ALLOWED (405) status */
  notAllowed<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.METHOD_NOT_ALLOWED);
  },

  /** Alias for response with INTERNAL_SERVER_ERROR (500) status */
  internalServerError<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.INTERNAL_SERVER_ERROR);
  },

  /** Alias for response with NOT_IMPLEMENTED (501) status */
  notImplemented<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.NOT_IMPLEMENTED);
  },

  /** Alias for response with BAD_GATEWAY (502) status */
  badGateway<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.BAD_GATEWAY);
  },

  /** Alias for response with GATEWAY_TIMEOUT (504) status */
  gatewayTimeout<T = string>(req: Request, res: Response, data?: T): Response {
    return respond(req, res, data, stc.GATEWAY_TIMEOUT);
  },
};
