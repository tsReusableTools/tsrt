import { Request, Response, NextFunction } from 'express';

import { send, msg } from '@tsd/utils';

export function sendResponseMiddleware(req: Request, res: Response, next: NextFunction): void {
  const oldSend = res.send;

  res.send = (data): Response => {
    res.send = oldSend;
    const response = msg.isValidConfig(data) ? data : { status: res.statusCode, data };
    return send(req, res, response);
  };

  next();
}
