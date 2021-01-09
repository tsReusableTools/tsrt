import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

import { IApplicationLogger, createPatchedSend } from '@tsrt/application';

export function createGlobalErrorHandler(logger?: IApplicationLogger): ErrorRequestHandler {
  const patchedSend = createPatchedSend(logger);
  /* eslint-disable-next-line */
  return (err: any, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) return next(err);
    if (typeof logger?.error === 'function') logger.error(err);
    const error = { status: err.status ?? 500, data: err.data ?? err.message ?? 'Internal Server Error' };
    res.status(error.status);
    patchedSend(res, error.data);
  };
}
