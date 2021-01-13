/* eslint-disable max-classes-per-file */
import { Property, CollectionOf } from '@tsed/schema';
import { IsOptional, IsString, IsNumber } from 'class-validator';

import { BaseDto } from './BaseDto';

export class CommonQueryParams extends BaseDto<IQueryParams> {
  @CollectionOf(String)
  @IsOptional()
  @IsString()
  public select?: string;

  @CollectionOf(String)
  @IsOptional()
  @IsString()
  public include?: string;
}

export class ReadOneQueryParams extends CommonQueryParams {
  @Property(String)
  @IsOptional()
  @IsString()
  public getBy?: string;
}

export class ReadListQueryParams extends CommonQueryParams {
  @Property(Number)
  @IsOptional()
  @IsNumber()
  public skip?: number;

  @Property(String || Number)
  @IsOptional()
  @IsString()
  public limit?: 'none' | number;

  @CollectionOf(String)
  @IsOptional()
  @IsString()
  public sort?: string;

  @Property(String)
  @IsOptional()
  public filter?: GenericObject;
}
