/* eslint-disable max-classes-per-file */
import { Property, CollectionOf } from '@tsed/common';
import { IsOptional } from 'class-validator';

import { BaseDto } from './BaseDto';

export class CommonQueryParams extends BaseDto<IQueryParams> {
  @CollectionOf(String)
  @IsOptional()
  public select?: string;

  @CollectionOf(String)
  @IsOptional()
  public include?: string;
}

export class ReadOneQueryParams extends CommonQueryParams {
  @Property(String)
  @IsOptional()
  public getBy?: string;
}

export class ReadListQueryParams extends CommonQueryParams {
  @Property(Number)
  @IsOptional()
  public skip?: number;

  @Property(String || Number)
  @IsOptional()
  public limit?: string | number;

  @CollectionOf(String)
  @IsOptional()
  public sort?: string;

  @Property(String)
  @IsOptional()
  public filter?: GenericObject;
}
