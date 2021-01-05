import { Request, Response, NextFunction } from 'express';

import { parseTypes, isEmpty } from '@tsrt/utils';

/** Parses request headers and cokkies data types */
export function parseCookiesHandler(req: Request, _res: Response, next: NextFunction): Response | void {
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

  // Write into req.headers.cookie string without duplicates
  if (req.cookies) {
    let headersWithoutDuplicates = '';
    Object.keys(req.cookies).forEach((item) => {
      headersWithoutDuplicates += `${item}=${req.cookies[item]};`;
    });
    req.headers.cookie = headersWithoutDuplicates;
  }

  next();
}
