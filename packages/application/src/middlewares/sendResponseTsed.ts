import { Request, Response, NextFunction } from 'express';

import { send, msg, createApiResponse, log, isStream } from '@tsd/utils';

/* eslint-disable-next-line */
function shouldBeStreamed(data: any): boolean {
  return isStream(data);
}

function patch<T extends GenericObject>(object: T): T {
  const result: GenericObject = object;
  result.patchedBySendResponseHandler = true;
  return result as T;
}

function isPatched<T extends GenericObject>(object: T): boolean {
  return !!object.patchedBySendResponseHandler;
}

export function sendResponseTsed(req: Request, res: Response, next: NextFunction): void {
  if (isPatched(res.send)) return next();
  const originalSend = res.send;

  res.send = (data): Response => {
    res.send = originalSend;

    if (shouldBeStreamed(data)) return res.pipe(data);

    const response = (send.isValid(data) || msg.isValid(data))
      ? { status: data.status, data: data.data }
      : { status: res.statusCode, data };

    const logResponse = createApiResponse(res, response);
    if (logResponse.status >= 400) log.error(logResponse);
    else log.info(logResponse);

    return send(res, response);
  };

  res.send = patch(res.send);

  next();

  // const { data, endpoint } = req.ctx;
  // if (data === undefined) {
  //   return response.send();
  // }
  //
  // if (this.shouldBeStreamed(data)) {
  //   data.pipe(response);
  //
  //   return response;
  // }
  //
  // if (this.shouldBeSent(data)) {
  //   return response.send(data);
  // }
  //
  // return response.send(data);
}
