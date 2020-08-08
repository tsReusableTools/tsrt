import expressReqId from 'express-request-id';
import { Request, Response, NextFunction } from 'express';

export function requestIdHandler(req: Request, res: Response, next: NextFunction): void {
  const expressReqIdHandler = expressReqId();
  return expressReqIdHandler(req, res, next);
}
