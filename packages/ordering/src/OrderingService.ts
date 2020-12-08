import cloneDeep from 'lodash.clonedeep';
import { parseTypes, range, clamp, throwHttpError, isNil } from '@tsrt/utils';

import { IOrderingOptions, IOrderingServiceOptions, IOrderingItemDefault } from './types';
import { defaultOptions } from './utils';

export class OrderingService<T extends GenericObject = IOrderingItemDefault> {
  protected readonly _options: IOrderingServiceOptions;

  constructor(options?: IOrderingServiceOptions) {
    this._options = { ...defaultOptions, ...options };
    if (!this._options.primaryKey) this._options.primaryKey = defaultOptions.primaryKey;
    if (!this._options.orderKey) this._options.orderKey = defaultOptions.orderKey;
  }

  /**
   *  Reorders target applying orders from listOfOrdersChanges one by one.
   *
   *  @param target - Original array.
   *  @param listOfOrdersChanges - List of order changes like: [{ `primaryKey`: value, `oderKey`: newOrderValue }]
   *
   *  @returns list, reordered according to provided order changes.
   */
  public reorder<I extends T = T>(
    target: I[], listOfOrdersChanges: Array<Required<T>> = [], config: IOrderingOptions = { },
  ): Array<I & Required<T>> {
    const {
      allowOrdersOutOfRange = this._options.allowOrdersOutOfRange,
      refreshSequence = this._options.refreshSequence,
      clampRange = this._options.clampRange,
    } = config;

    let result = this.reorderIfHasDuplicateOrEmptyOrders(target);
    if (!listOfOrdersChanges?.length) return refreshSequence ? this.refreshSequence(result) : result;

    this.hasInvalidOrderingItems(listOfOrdersChanges, true);

    const { min, max } = this.getOrderRange(result.map((item) => item[this.order]));

    listOfOrdersChanges.forEach((newItem) => {
      const prevItem = result.find((item) => item[this.pk] === newItem[this.pk]);
      if (!prevItem) throwHttpError.badRequest(`Invalid item with '${this.pk}' = ${newItem[this.pk]}`);

      let { [this.order]: newOrder } = newItem;
      const { [this.order]: prevOrder } = prevItem;

      if (clampRange) newOrder = clamp(newOrder, max, min) as T[string];

      if ((newOrder > max || newOrder < min) && !allowOrdersOutOfRange) {
        throwHttpError.badRequest(`'${this.order}' = ${newItem[this.order]} is out of range: [${min}, ${max}]`);
      }

      result = result
        .map((item) => {
          const iOrder = item[this.order];
          if (item[this.pk] === newItem[this.pk]) return { ...item, [this.order]: newOrder };
          if (newOrder > prevOrder) return (iOrder < prevOrder || iOrder > newOrder) ? item : { ...item, [this.order]: iOrder - 1 };
          if (newOrder < prevOrder) return (iOrder < newOrder || iOrder > prevOrder) ? item : { ...item, [this.order]: iOrder + 1 };
          return item;
        })
        .sort((a, b) => a[this.order] - b[this.order]);
    });

    const withoutDuplicates = this.reorderIfHasDuplicateOrEmptyOrders(result);
    return refreshSequence ? this.refreshSequence(withoutDuplicates) : withoutDuplicates;
  }

  /**
   *  Reorders target, depending on position of reordered item.
   *  Returns new array and does not mutate original array unless `updateTarget` falg is provided.
   *
   *  @param target - Original array.
   *  @param prevIndex - Item to reorder prev (from) index.
   *  @param newIndex - Item to reorder new (to) index.
   *  @param [updateTarget] - Whether to mutate original array.
   */
  public reorderByIndex<I extends Required<T> = Required<T>>(
    target: I[], prevIndex: number, newIndex: number, updateTarget = false,
  ): I[] {
    const result = this.moveItemInArrayExtended(target, prevIndex, newIndex, updateTarget);
    if (!result) return target;

    this.hasInvalidOrderingItems(target, true);

    const { from, to, item: { [this.pk]: pk }, array } = result;

    return array
      .map((item, i) => {
        if (from < to) {
          if (i < from || i > to) return { ...item };
          if (item[this.pk] === pk) return { ...item, [this.order]: array[i - 1][this.order] };
          return { ...item, [this.order]: item[this.order] - 1 };
        }

        if (from > to) {
          if (i > from || i < to) return { ...item };
          if (item[this.pk] === pk) return { ...item, [this.order]: array[i + 1][this.order] };
          return { ...item, [this.order]: item[this.order] + 1 };
        }

        return { ...item };
      })
      .sort((a, b) => a[this.order] - b[this.order]);
  }

  /**
   *  Moves item form prevIndex to newIndex inside array.
   *  Returns new array and does not mutate original array unless `updateTarget` falg is provided.
   *
   *  @param target - Original array.
   *  @param prevIndex - Item to move prev (from) index.
   *  @param newIndex - Item to move new (to) index.
   *  @param [updateTarget] - Whether to mutate original array.
   */
  public moveItemInArray<I extends T = T>(target: I[], prevIndex: number, newIndex: number, updateTarget = false): I[] {
    const result = this.moveItemInArrayExtended(target, prevIndex, newIndex, updateTarget);
    return !result ? target : result.array;
  }

  /**
   *  Checks whether provided array has items without order / empty orders. If has - returns first such item.
   *
   *  @param target - Target array.
   */
  public hasDuplicateOrEmptyOrders<I extends T = T>(target: I[]): I {
    const invalidItem = this.hasInvalidOrderingItems(target);
    if (invalidItem) return invalidItem;

    const parsed = parseTypes(target);
    const sorted = parsed.sort((a, b) => a[this.order] - b[this.order]);
    const found = sorted.find((item, i, arr) => (
      isNil(item[this.order])
      || (arr[i - 1] && arr[i - 1][this.order] === item[this.order])
      || (arr[i + 1] && arr[i + 1][this.order] === item[this.order])
    ));

    return found;
  }

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
  public hasInvalidOrderingItems<I extends T = T>(target: I[], strict = false): I {
    this.throwErrorIfNotArray(target);

    const parsed = parseTypes(target);

    const found = parsed.find((item) => (
      !item
      || !Object.hasOwnProperty.call(item, this.pk)
      || isNil(item[this.pk])
      || (strict && !Object.hasOwnProperty.call(item, this.order))
      || (!isNil(item[this.order]) && typeof item[this.order] !== 'number')
      || (!isNil(item[this.order]) && item[this.order] < 0)
    ));

    const message = `Invalid item found in list for reordering. ${this.confgiIsMsg}`;
    if (found) throwHttpError({ status: 400, data: found, message });

    return found;
  }

  protected refreshSequence<I extends T = T>(target: I[]): I[] {
    return target
      .sort((a, b) => a[this.order] - b[this.order])
      .map((item, i) => ({ ...item, [this.order]: i }));
  }

  /**
   *  Returns new array w/ valid orders for those items without orders or w/ duplicates.
   *
   *  @param target - Target array.
   */
  protected reorderIfHasDuplicateOrEmptyOrders<I extends T = T>(target: I[], config: IOrderingOptions = { }): Array<I & Required<T>> {
    if (!this.hasDuplicateOrEmptyOrders(target)) return target as Array<I & Required<T>>;
    const { insertAfterOnly = this._options.insertAfterOnly } = config;

    const parsed = parseTypes(target);
    let orders = this.getUniqueValues(parsed.map((item) => item[this.order]));
    let order: number;

    return parsed
      .map((item, i) => {
        const isDuplicate = parsed.find((unit, j) => j < i && unit[this.order] === item[this.order]);
        const isEmpty = !Object.hasOwnProperty.call(item, this.order) || isNil(item[this.order]);
        if (!isDuplicate && !isEmpty) return item;
        [order, orders] = this.getUniqueValue(orders, insertAfterOnly);
        return { ...item, [this.order]: order };
      })
      .sort((a, b) => a[this.order] - b[this.order]) as Array<I & Required<T>>;
  }

  protected moveItemInArrayExtended<I extends T = T>(
    target: I[], prevIndex: number, newIndex: number, updateTarget = false,
  ): { from: number; to: number; item: I; array: I[] } {
    this.throwErrorIfNotArray(target);

    const from = clamp(prevIndex, target.length - 1);
    const to = clamp(newIndex, target.length - 1);
    if (from === to) return;

    const array = updateTarget ? target : cloneDeep(target);
    const item = array[from];

    array.splice(from, 1);
    array.splice(to, 0, item);

    return { from, to, item, array };
  }

  protected get pk(): string { return this._options?.primaryKey; }

  protected get order(): string { return this._options?.orderKey; }

  protected get confgiIsMsg(): string { return `Config is: ${JSON.stringify(this._options)}`; }

  protected getUniqueValues(target: number[]): number[] { return Array.from(new Set(target)).filter((item) => !isNil(item)); }

  protected getUniqueValue(values: number[], insertAfterOnly = false): [number, number[]] {
    const { min, max } = this.getOrderRange(values);
    if (insertAfterOnly) return [max + 1, values.concat(max + 1)];
    let unique = range(min, max).find((item) => !values.includes(item));
    if (isNil(unique)) unique = min > 0 ? min - 1 : max + 1;
    return [unique, values.concat(unique)];
  }

  protected getOrderRange(target: number[] = []): { min: number; max: number } {
    let min = target[0] ?? 0;
    let max = target[0] ?? 0;

    target.forEach((item) => {
      if (isNil(item)) return;
      if (item < min) min = item;
      if (item > max) max = item;
    });

    return { min, max };
  }

  protected throwErrorIfNotArray<I>(target: I[]): void {
    const message = 'Invalid argument provided. It should be a valid Array';
    if (!Array.isArray(target)) throwHttpError({ status: 400, data: message, message });
  }
}

export const {
  moveItemInArray,
  reorder,
  reorderByIndex,
  hasDuplicateOrEmptyOrders,
  hasInvalidOrderingItems,
} = new OrderingService();
