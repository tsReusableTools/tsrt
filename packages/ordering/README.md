# Typescript Reusable Tools: Ordering


[![npm version](https://img.shields.io/npm/v/@tsrt/ordering.svg)](https://www.npmjs.com/package/@tsrt/ordering) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/ordering.svg)](https://www.npmjs.com/package/@tsrt/ordering) [![Downloads](https://img.shields.io/npm/dm/@tsrt/ordering.svg)](https://www.npmjs.com/package/@tsrt/ordering)

Lib for common ordering operations with arrays.

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.

So prefer using exact version instead of version with `~` or `^`.

## Usage

```ts
import { OrderingService, IOrderingServiceConfig } from '@tsrt/ordering';

interface IOrderedItem { pk: string; order: number };

// Or use default IOrderingItemDefault from package, for example.
// Or redeclare IOrderingItemDefault via Typescipt module augumentation.
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation

const config: IOrderingServiceConfig = { ... }
const orderingService = new OrderingService<IOrderedItem>(config);

const initialArray = [{ id: 'A', order: 0 }, { id: 'B', order: 14 }, { id: 'C', order: 22 }];
const orderChanges = [{ id: 'A', order: 15 }, { id: 'C', order: 2 }];

// It will reorder [A, B, C] into [B, A, C] -> [C, B, A], `order` properties will be updated accordingly.
const result = orderingService.reorder(initialArray, orderChanges);

// It will reorder [A, B, C] into [B, C, A], `order` properties will be updated accordingly.
const result = orderingService.reorderByIndex(initialArray, 0, 2);

// Just move item ia array from prevIndex to newIndex. DO NOT updates `order` properties.
const result = orderingService.moveItemInArray(initialArray, 0, 2);

// Here we can check whether it is necessary to perform reordering.
const result = orderingService.hasDuplicateOrEmptyOrders(initialArray);

// Here we can check whether there are any invalid items for reordering inside array.
const result = orderingService.hasInvalidOrderingItems(initialArray);
```

## API reference

##### OrderingService
```ts
export declare class OrderingService<T extends GenericObject = IOrderingItemDefault> {
  /**
   *  Reorders target applying orders from listOfOrdersChanges one by one.
   *
   *  @param target - Original array.
   *  @param listOfOrdersChanges - List of order changes like: [{ `primaryKey`: value, `oderKey`: newOrderValue }]
   *
   *  @returns list, reordered according to provided order changes.
   */
  reorder<I extends T = T>(target: I[], listOfOrdersChanges?: Array<Required<T>>, config?: IOrderingOptions): Array<I & Required<T>>;

  /**
   *  Reorders target, depending on position of reordered item.
   *  Returns new array and does not mutate original array unless `updateTarget` falg is provided.
   *
   *  @param target - Original array.
   *  @param prevIndex - Item to reorder prev (from) index.
   *  @param newIndex - Item to reorder new (to) index.
   *  @param [updateTarget] - Whether to mutate original array.
   */
  reorderByIndex<I extends Required<T> = Required<T>>(target: I[], prevIndex: number, newIndex: number, updateTarget?: boolean): I[];

  /**
   *  Moves item form prevIndex to newIndex inside array.
   *  Returns new array and does not mutate original array unless `updateTarget` falg is provided.
   *
   *  @param target - Original array.
   *  @param prevIndex - Item to move prev (from) index.
   *  @param newIndex - Item to move new (to) index.
   *  @param [updateTarget] - Whether to mutate original array.
   */
  moveItemInArray<I extends T = T>(target: I[], prevIndex: number, newIndex: number, updateTarget?: boolean): I[];

  /**
   *  Checks whether provided array has items without order / empty orders. If has - returns first such item.
   *
   *  @param target - Target array.
   */
  hasDuplicateOrEmptyOrders<I extends T = T>(target: I[]): I;

  /**
   *  Checks whether provided array has invalid items. If has - returns first such item.
   *
   *  Invalid if at least for 1 item inside array one of next conditions is true:
   *  - item is null/undefined/not object;
   *  - item has no `primarKey` property;
   *  - item has no `orderKey` property (only is `strict` mode);
   *  - item `orderKey` property is not null/undefined and not number;
   *  - item `orderKey` property is not null/undefined and less than 0;
   *
   *  @param target - Target array.
   *  @param [strict=false] - Whether to throw an Error if there is no `order` property for at least 1 item.
   */
  hasInvalidOrderingItems<I extends T = T>(target: I[], strict?: boolean): I;
}
```

##### Aliases

Is is also possible to import aliases for all OrderingService `public methods` as functions.

This functions will work with [default config](#default-config):

```ts
import { reorder, reorderByIndex, moveItemInArray, hasDuplicateOrEmptyOrders, hasInvalidOrderingItems } from '@tsrt/ordering';
```

## Options

```ts
/** Options for OrderingService reorder method. */
export interface IOrderingOptions {
  /** If false, will throw Error if `newOrder` is out of range [min, ..., max] of existing orders. Default: false. */
  allowOrdersOutOfRange?: boolean;

  /** Whether to clamp `newOrder` into range [min, ..., max] of existing orders. Default: false. */
  clampRange?: boolean;

  /**
   *  Whether to insert `empty` or `duplicate` orders only after `max` order of existing orders. Default: false.
   *  If false, will find the minimal unique order inside range [min, ..., max] of existing orders.
   */
  insertAfterOnly?: boolean;

  /** Whether to refresh orders' sequence after reordering (start from zero). Default: false. */
  refreshSequence?: boolean;
}

/** Options for OrderingService constructor. */
export interface IOrderingServiceOptions extends IOrderingOptions {
  /** Primary key to identify entities inside array for reordering. Default: 'id'. */
  primaryKey?: string;

  /** Order key to reorder entities inside array by. Default: 'order'. */
  orderKey?: string;
}

/**
 *  Default ordering item.
 *  Empty interface for TypeScript module augumentation in importing module.
 *
 *  Example: declare module '@tsrt/ordering' { export interface IOrderingItemDefault { pk: number; order?: number } }
 *  @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation.
 */
export interface IOrderingItemDefault { }
```

### Default options:

```ts
export const defaultOptions: IOrderingServiceOptions = {
  primaryKey: 'id',
  orderKey: 'order',
  allowOrdersOutOfRange: false,
  clampRange: false,
  insertAfterOnly: false,
  refreshSequence: false,
};
```
