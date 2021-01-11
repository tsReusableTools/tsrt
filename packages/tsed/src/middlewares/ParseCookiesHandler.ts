import { Middleware, Req, Res, Next } from '@tsed/common';

import { parseTypes, isEmpty } from '@tsrt/utils';

@Middleware()
export class ParseCookiesHandler {
  public use(@Req() req: Req, @Res() res: Res, @Next() next: Next): void {
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
}
