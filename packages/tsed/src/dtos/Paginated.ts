import { Property, Generics, CollectionOf } from '@tsed/schema';
import { IsArray, IsOptional } from 'class-validator';
import { IPagedData } from '@tsrt/utils';
@Generics('Model')
export class Paginated<Model> implements Partial<IPagedData> {
  @Property() @IsOptional() public total?: number;
  @Property() @IsOptional() public nextSkip?: number;
  @CollectionOf('Model') @IsArray() public value: Model[];
}

// //
// //
// // Commented for TsED v5.x
// //
// //

// import { Property } from '@tsed/schema';
// import { IsOptional } from 'class-validator';

// import { IPagedData } from '@tsrt/utils';

// import { BaseDto } from './BaseDto';

// export class Paginated extends BaseDto<IPagedData> implements Partial<IPagedData> {
//   @Property()
//   @IsOptional()
//   public total?: number;

//   @Property()
//   @IsOptional()
//   public nextSkip?: number;
// }

// // Example usage:
// // export class PagedSomeModel extends PagedDataDto {
// //   @PropertyType(SomeModel)
// //   public value: SomeModel[];
// // }
