import { Middleware, Req, Res, Next } from '@tsed/common';
import { Configuration } from '@tsed/di';

import { createLoggedSend } from '@tsrt/api-utils';

import { IApplicationPrivateSettings } from '../interfaces';

@Middleware()
export class NotFoundHandler {
  @Configuration() public settings: IApplicationPrivateSettings;

  /* eslint-disable-next-line */
  public use(@Req() _req: Req, @Res() res: Res, @Next() next: Next): Res | void {
    const loggedSend = this.settings?.loggedSend ?? createLoggedSend();

    if (res.headersSent) return next();
    res.status(404);
    loggedSend(res, 'Not Found');
  }
}
