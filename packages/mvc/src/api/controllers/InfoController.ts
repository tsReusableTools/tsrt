import { Controller, Get, Status } from '@tsed/common';

import { COMMIT as commit, DATE_TIME as dateTime } from '@utils/config';
import * as pkg from '../../../package.json';

@Controller('/info')
export class InfoController {
  @Get('/')
  @Status(200)
  public getInfo(): GenericObject {
    return { commit, dateTime, instance: process.env.NODE_ENV || 'dev', version: pkg.version };
  }
}
