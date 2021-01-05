import { Request, Response, NextFunction } from 'express';

import { parseTypes } from '@tsrt/utils';

/** Parses request: query, params & headers and corrects data types */
export function parseRequestHandler(req: Request, _res: Response, next: NextFunction): Response | void {
  req.query = parseTypes((req.query));
  req.params = parseTypes(req.params);
  req.headers = parseTypes(req.headers);

  next();
}
