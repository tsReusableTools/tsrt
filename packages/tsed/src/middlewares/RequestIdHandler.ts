import { Middleware, Req, Res, Next } from '@tsed/common';
import expressReqId from 'express-request-id';

@Middleware()
export class RequestIdHandler {
  public use(@Req() req: Req, @Res() res: Res, @Next() next: Next): void {
    const expressReqIdHandler = expressReqId();
    return expressReqIdHandler(req, res, next);
  }
}
