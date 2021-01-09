import { OverrideProvider, Req, Res, SendResponseMiddleware as BaseSendResponseMiddleware } from '@tsed/common';
import { Configuration } from '@tsed/di';

import { createPatchedSend } from '@tsrt/application';

import { IApplicationSettings } from '../interfaces';

@OverrideProvider(BaseSendResponseMiddleware)
export class SendResponseMiddleware {
  @Configuration() public settings: IApplicationSettings;

  public use(@Req() req: Req, @Res() res: Res): Res {
    return createPatchedSend(this.settings.log)(res, req.$ctx?.data) as Res;
  }
}
