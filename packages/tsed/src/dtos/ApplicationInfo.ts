import { Property, Required } from '@tsed/schema';
import { IsOptional, IsString, IsDateString } from 'class-validator';

import { BaseDto } from './BaseDto';

export class ApplicationInfo extends BaseDto<IApplicationInfo> implements IApplicationInfo {
  @Property()
  @Required()
  @IsDateString()
  public dateTime: string;

  @Property()
  @IsOptional()
  @IsString()
  public commit?: string;

  @Property()
  @Required()
  @IsString()
  public version: string;

  @Property()
  @Required()
  @IsString()
  public env: string;
}

export interface IApplicationInfo {
  dateTime: string;
  commit?: string;
  version: string;
  env: string;
}
