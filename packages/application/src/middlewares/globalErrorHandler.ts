import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

import { send } from '@tsrt/api-utils';

import { IApplicationLogger } from '../interfaces';

export function createGlobalErrorHandler(logger?: IApplicationLogger): ErrorRequestHandler {
  /* eslint-disable-next-line */
  return (err: any, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) return next(err);
    if (logger) logger.error(err);
    const error = { status: err.status || 500, data: err.data || err.message || 'Internal Server Error' };
    send(res, error.status, error.data);
  };
}
