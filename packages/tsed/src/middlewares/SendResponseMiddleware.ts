// import { isBoolean, isNumber, isStream, isString } from '@tsed/core';
// import { OverrideProvider, Req, Res, SendResponseMiddleware as BaseSendResponseMiddleware } from '@tsed/common';
import { OverrideProvider, Req, Res, Middleware } from '@tsed/common';

import { createPatchedSend } from '@tsrt/application';

const patchedSend = createPatchedSend();

@Middleware()
export class SendResponseMiddleware {
  public use(@Req() req: Req, @Res() res: Res): Res {
    return patchedSend(res, req.$ctx.data) as Res;
  }
}
