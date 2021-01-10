import { OverrideProvider, Req, Res, SendResponseMiddleware as BaseSendResponseMiddleware } from '@tsed/common';
import { Configuration } from '@tsed/di';

import { createPatchedSend } from '@tsrt/application';
import { parseTypes } from '@tsrt/utils';

import { IApplicationSettings } from '../interfaces';

@OverrideProvider(BaseSendResponseMiddleware)
export class SendResponseMiddleware {
  @Configuration() public settings: IApplicationSettings;

  public use(@Req() req: Req, @Res() res: Res): Res {
    const data = this.settings.parseResponseTypes ? parseTypes(req.$ctx?.data) : req.$ctx?.data;
    return createPatchedSend(this.settings.log)(res, data) as Res;
  }
}
