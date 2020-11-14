import { Request, Response, NextFunction } from 'express';

import { send } from '@tsd/api-utils';

export function notFoundHandler(_req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) return next();
  send.notFound(res);
}