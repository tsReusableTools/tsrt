import { NextFunction as ExpressNext, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IMiddlewareError, Middleware, Request, Response, Next } from '@tsed/common';

import { send } from '@tsu/utils';

@Middleware()
export class NotFoundErrorHandler implements IMiddlewareError {
  public use(@Request() req: ExpressRequest, @Response() res: ExpressResponse, @Next() next: ExpressNext): void {
    if (res.headersSent) return next();
    send.badRequest(req, res);
    return next();
  }
}
