/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction, RequestHandler } from 'express';

import { msg, isStream, parseTypes } from '@tsrt/utils';
import { send, createApiResponse } from '@tsrt/api-utils';

import { IApplicationLogger, IApplicationSettings } from '../interfaces';

function patch<T extends GenericObject>(object: T): T {
  const result: GenericObject = object;
  result.patchedBySendResponseHandler = true;
  return result as T;
}

function isPatched<T extends GenericObject>(object: T): boolean {
  return !!object.patchedBySendResponseHandler;
}

export function createPatchedSend(logger?: IApplicationLogger): (res: Response, data: any) => Response {
  return (res: Response, data: any): Response => {
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

export function createSendResponseHandler(settings: IApplicationSettings = { }): RequestHandler {
  const patchedSend = createPatchedSend(settings?.log);

  return (_req: Request, res: Response, next: NextFunction): void => {
    if (isPatched(res.send)) return next();
    const originalSend = res.send;

    res.send = (data): Response => {
      res.send = originalSend;
      const parsedData = settings?.parseResponseTypes ? parseTypes(data) : data;
      return patchedSend(res, parsedData);
    };

    res.send = patch(res.send);

    next();
  };
}
