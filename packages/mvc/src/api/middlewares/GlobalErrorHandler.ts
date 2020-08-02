import { NextFunction as ExpressNext, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IMiddlewareError, Middleware, Request, Response, Next, Err } from '@tsed/common';

import { send, log } from '@tsu/utils';

@Middleware()
export class GlobalErrorHandler implements IMiddlewareError {
  public use(
    @Err() err: GenericObject,
      @Request() req: ExpressRequest,
      @Response() res: ExpressResponse,
      @Next() next: ExpressNext,
  ): void {
    if (res.headersSent) return next(err);

    if (err.stack) log.error(err.stack);
    else log.error(err);

    const error = { status: err.status || 500, data: err.data || err.message || 'Internal Server Error' };
    send(req, res, error);
    return next();
  }
}
