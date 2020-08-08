/* eslint-disable max-classes-per-file */
import { Property, AllowTypes } from '@tsed/common';

export class ReadOneQueryParams implements IQueryParams {
  @Property({ use: String })
  @AllowTypes('string')
  public select?: string;

  @Property({ use: String })
  @AllowTypes('string')
  public getBy?: string;

  @Property({ use: String })
  @AllowTypes('string')
  public include?: string;
}

export class ReadListQueryParams extends ReadOneQueryParams implements IQueryParams {
  @Property({ use: Number })
  @AllowTypes('number')
  public skip?: number;

  @Property({ use: String })
  @AllowTypes('number', 'string')
  public limit?: number | string;

  @Property({ use: String })
  @AllowTypes('string')
  public sort?: string;

  @Property({ use: String })
  @AllowTypes('object')
  public filter?: GenericObject;
}
