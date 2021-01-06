import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(_req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) return next();
  res.status(404).send('Not Found');
}
