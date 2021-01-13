import { Middleware, Err, Req, Res, Next } from '@tsed/common';
import { Configuration } from '@tsed/di';

import { createLoggedSend } from '@tsrt/api-utils';

import { IApplicationPrivateSettings } from '../interfaces';

@Middleware()
export class GlobalErrorHandler {
  @Configuration() public settings: IApplicationPrivateSettings;

  /* eslint-disable-next-line */
  public use(@Err() err: any, @Req() req: Req, @Res() res: Res, @Next() next: Next): Res | void {
    const loggedSend = this.settings?.loggedSend ?? createLoggedSend();

    if (res.headersSent) return next(err);
    if (typeof this.settings.log?.error === 'function') this.settings.log.error(err);
    const error = { status: err.status ?? 500, data: err.data ?? err.message ?? 'Internal Server Error' };
    res.status(error.status);
    loggedSend(res, error.data);
  }
}
