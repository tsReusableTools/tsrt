import { Request, Response, NextFunction } from 'express';

import { log } from '@tsd/logger';
import { send } from '@tsd/api-utils';

/* eslint-disable-next-line */
export function globalErrorHandler(err: any, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) return next(err);
  log.error(err);
  const error = { status: err.status || 500, data: err.data || err.message || 'Internal Server Error' };
  send(res, error.status, error.data);
}
