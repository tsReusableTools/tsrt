import { Request, Response, NextFunction } from 'express';

import { log, send } from '@tsd/utils';

/* eslint-disable-next-line */
export function globalErrorHandler(err: any, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) return next(err);

  if (err.stack) log.error(err.stack);
  else log.error(err);

  const error = { status: err.status || 500, data: err.data || err.message || 'Internal Server Error' };
  send(res, error.status, error.data);
}
