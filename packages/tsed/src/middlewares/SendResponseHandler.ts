import { Response } from 'express';
import { OverrideProvider, Req, Res, SendResponseMiddleware } from '@tsed/common';
import { Configuration } from '@tsed/di';

import { createLoggedSend } from '@tsrt/api-utils';
import { parseTypes } from '@tsrt/utils';

import { IApplicationPrivateSettings } from '../interfaces';

@OverrideProvider(SendResponseMiddleware)
export class SendResponseHandler {
  @Configuration() public settings: IApplicationPrivateSettings;

  public use(@Req() req: Req, @Res() res: Res): Response {
    if (this.settings.sendResponseHandler) return this.settings.sendResponseHandler(req, res);
    const loggedSend = this.settings?.loggedSend ?? createLoggedSend();
    const data = this.settings.parseResponseTypes ? parseTypes(req.$ctx?.data) : req.$ctx?.data;
    return loggedSend(res, data);
  }
}
