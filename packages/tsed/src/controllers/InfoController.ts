import { Controller, Get } from '@tsed/common';
import { Summary } from '@tsed/swagger';

import { getApplicationInfo, IApplicationInfo } from '@tsd/application';

@Controller('/info')
export class InfoController {
  @Get('/')
  @Summary('Shows current application info')
  public check(): IApplicationInfo {
    return getApplicationInfo();
  }
}
