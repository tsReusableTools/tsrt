import { Request, Response, NextFunction } from 'express';

import { parseTypes, isEmpty, parseArrayLikeObjectIntoArray } from '@tsd/utils';

/** Parses request: query, params, body & headers and corrects data types */
export function parseRequest(
  req: Request, _res: Response, next: NextFunction,
): Response | void {
  req.query = parseTypes((req.query));
  if (req.query.filter) req.query.filter = parseArrayLikeObjectIntoArray(req.query.filter);
  req.params = parseTypes(req.params);
  req.body = parseTypes(req.body);
  req.headers = parseTypes(req.headers);

  // Parse req.headers.cookie and put it into req.cookies
  if (req.headers.cookie) {
    const pairs = req.headers.cookie.split('; ');
    const obj: GenericObject = { };
    pairs.forEach((item) => {
      const [key, prop] = item.split('=');
      obj[key] = prop;
    });
    if (!isEmpty(obj)) req.cookies = parseTypes(obj);
  }

  // Write into req.headers.cookie string without duplicats
  if (req.cookies) {
    let headersWithoutDuplicates = '';
    Object.keys(req.cookies).forEach((item) => {
      headersWithoutDuplicates += `${item}=${req.cookies[item]};`;
    });
    req.headers.cookie = headersWithoutDuplicates;
  }

  next();
}
