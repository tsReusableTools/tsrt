import { Property, Required } from '@tsed/schema';
import { IsOptional, IsString, IsDateString } from 'class-validator';

import { BaseDto } from './BaseDto';

export class ApplicationInfo extends BaseDto<IApplicationInfo> implements IApplicationInfo {
  @Property()
  @Required()
  @IsDateString()
  dateTime: string;

  @Property()
  @IsOptional()
  @IsString()
  commit?: string;

  @Property()
  @Required()
  @IsString()
  version: string;

  @Property()
  @Required()
  @IsString()
  env: string;
}

export interface IApplicationInfo {
  dateTime: string;
  commit?: string;
  version: string;
  env: string;
}
