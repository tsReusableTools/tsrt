import { Middleware, Req, Res, Next } from '@tsed/common';

import { parseTypes } from '@tsrt/utils';

@Middleware()
export class ParseRequestHandler {
  public use(@Req() req: Req, @Res() res: Res, @Next() next: Next): void {
    req.query = parseTypes((req.query));
    req.params = parseTypes(req.params);
    req.headers = parseTypes(req.headers);

    next();
  }
}
