import { OverrideProvider, Req, Res, SendResponseMiddleware as BaseSendResponseMiddleware } from '@tsed/common';
import { isStream } from '@tsed/core';

import { send } from '@tsd/utils';

@OverrideProvider(BaseSendResponseMiddleware)
export class SendResponseMiddleware {
  public use(@Req() req: Req, @Res() res: Res): Res {
    const { ctx: { data } } = req;

    if (data && isStream(data)) {
      data.pipe(res);
      return res;
    }

    return send(req, res, res.statusCode, data);
  }
}
