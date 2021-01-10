import { Property } from '@tsed/common';
import { IsOptional } from 'class-validator';

import { IPagedData } from '@tsrt/utils';

import { BaseDto } from './BaseDto';

export class Paginated extends BaseDto<IPagedData> implements Partial<IPagedData> {
  @Property()
  @IsOptional()
  public total?: number;

  @Property()
  @IsOptional()
  public nextSkip?: number;
}

// Example usage:
// export class PagedSomeModel extends PagedDataDto {
//   @PropertyType(SomeModel)
//   public value: SomeModel[];
// }

//
//
// Commented for TsED v6
//
//

// import { Property, Generics, CollectionOf, Default, Description, Example, Title } from '@tsed/schema';
// import { IsNumber, IsOptional } from 'class-validator';

// export interface IPagedData<T extends GenericObject = GenericObject> {
//   value: T[];
//   nextSkip?: number;
//   total?: number;
// }

// @Generics('Model')
// export class Paginated<Model> implements Partial<IPagedData> {
//   @Title("title")
//   @Example("example")
//   @Description("Description")
//   @Default("default")
//   @Property() public total?: number;
//   @Property() public nextSkip?: number;
//   @CollectionOf('Model') public value: Model[];
// }
