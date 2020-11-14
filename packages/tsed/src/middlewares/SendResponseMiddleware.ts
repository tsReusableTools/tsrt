// import { isBoolean, isNumber, isStream, isString } from '@tsed/core';
import { OverrideProvider, Req, Res, SendResponseMiddleware as BaseSendResponseMiddleware } from '@tsed/common';

import { patchedSend } from '@tsrt/application';

@OverrideProvider(BaseSendResponseMiddleware)
export class SendResponseMiddleware {
  public use(@Req() req: Req, @Res() res: Res): Res {
    return patchedSend(res, req.$ctx.data) as Res;
  }
}
