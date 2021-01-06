/* eslint-disable max-classes-per-file */
// import { AllowTypes, CollectionOf } from '@tsed/common';

import { CollectionOf } from '@tsed/common';

export class ReadOneQueryParams implements IQueryParams {
  // @Property({ use: String })
  @CollectionOf(String)
  // @AllowTypes('string')
  public select?: string;

  @CollectionOf(String)
  // @Property({ use: String })
  // @AllowTypes('string')
  public getBy?: string;

  @CollectionOf(String)
  // @Property({ use: String })
  // @AllowTypes('string')
  public include?: string;
}

export class ReadListQueryParams extends ReadOneQueryParams implements IQueryParams {
  @CollectionOf(Number)
  // @Property({ use: Number })
  // @AllowTypes('number')
  public skip?: number;

  @CollectionOf(String)
  // @Property({ use: String })
  // @AllowTypes('number', 'string')
  public limit?: number | string;

  @CollectionOf(String)
  // @Property({ use: String })
  // @AllowTypes('string')
  public sort?: string;

  @CollectionOf(String)
  // @Property({ use: String })
  // @AllowTypes('object')
  public filter?: GenericObject;
}
