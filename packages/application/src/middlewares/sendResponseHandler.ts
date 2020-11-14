import { Request, Response, NextFunction } from 'express';

import { msg, isStream } from '@tsrt/utils';
import { log } from '@tsrt/logger';
import { send, createApiResponse } from '@tsrt/api-utils';

function patch<T extends GenericObject>(object: T): T {
  const result: GenericObject = object;
  result.patchedBySendResponseHandler = true;
  return result as T;
}

function isPatched<T extends GenericObject>(object: T): boolean {
  return !!object.patchedBySendResponseHandler;
}

/* eslint-disable-next-line */
export function patchedSend(res: Response, data: any): Response {
  if (isStream(data)) return res.pipe(data);

  const response = (send.isValid(data) || msg.isValid(data))
    ? { status: data.status, data: data.data }
    : { status: res.statusCode, data };

  const logResponse = createApiResponse(res, response);
  if (logResponse.status >= 400) log.error(logResponse);
  else log.info(logResponse);

  return send(res, response);
  // return res.send(data);
}

export function sendResponseHandler(_req: Request, res: Response, next: NextFunction): void {
  if (isPatched(res.send)) return next();
  const originalSend = res.send;

  res.send = (data): Response => {
    res.send = originalSend;
    return patchedSend(res, data);
  };

  res.send = patch(res.send);

  next();
}
