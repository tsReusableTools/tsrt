/* eslint-disable @typescript-eslint/no-explicit-any */
import { Configuration } from '@tsed/di';
import { ResponseFilter, Context, ResponseFilterMethods } from '@tsed/common';

import { send, createApiResponse } from '@tsrt/api-utils';
import { msg, parseTypes } from '@tsrt/utils';

import { IApplicationPrivateSettings } from '../interfaces';

@ResponseFilter('application/json')
export class SendResponseHandler implements ResponseFilterMethods {
  @Configuration() public settings: IApplicationPrivateSettings;

  public transform(data: any, ctx: Context): any {
    const logger = this.settings.log;
    const res = ctx.getResponse();

    const response = (send.isValid(data) || msg.isValid(data))
      ? { status: data.status, data: data.data }
      : { status: res.statusCode, data };

    const logResponse = createApiResponse(res, response);
    if (typeof logger?.error === 'function' && logResponse.status >= 400) logger.error(logResponse);
    else if (typeof logger?.info === 'function') logger.info(logResponse);

    return this.settings.parseResponseTypes ? parseTypes(logResponse) : logResponse;
  }
}
