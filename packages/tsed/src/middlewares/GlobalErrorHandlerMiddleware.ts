import { Err, Req, Res, Next, Middleware } from '@tsed/common';

import { log } from '@tsrt/logger';
import { msg } from '@tsrt/utils';
import { createPatchedSend } from '@tsrt/application';

const patchedSend = createPatchedSend();

@Middleware()
export class GlobalErrorHandlerMiddleware {
  /* eslint-disable-next-line */
  public use(@Err() err: any, @Req() req: Req, @Res() res: Res, @Next() next: Next): void {
    if (res.headersSent) return next(err);
    log.error(err);
    const error = msg({ status: err.status, message: err.data || err.message || 'Internal Server Error' });
    patchedSend(res, error);
  }
}
