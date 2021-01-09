import { Request, Response, NextFunction, RequestHandler } from 'express';

import { IApplicationLogger, createPatchedSend } from '@tsrt/application';

export function createNotFoundHandler(logger?: IApplicationLogger): RequestHandler {
  const patchedSend = createPatchedSend(logger);
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) return next();
    res.status(404);
    patchedSend(res, 'Not Found');
  };
}
