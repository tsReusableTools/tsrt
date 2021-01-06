import { Controller, Get } from '@tsed/common';
import { Summary } from '@tsed/schema';

import { getApplicationInfo, IApplicationInfo } from '@tsrt/application';

@Controller('/info')
export class InfoController {
  @Get('/')
  @Summary('Shows current application info')
  public async check(): Promise<IApplicationInfo> {
    return getApplicationInfo();
  }
}
