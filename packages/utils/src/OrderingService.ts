import cloneDeep from 'lodash.clonedeep';

import { parseTypes, range, clamp } from './utils';
import { throwHttpError } from './HttpError';
import { isNil } from './objectUtils';
import { IOrderingConfig, IOrderingServiceConfig, IOrderingItemDefault } from './types';

const defaultConfig: IOrderingServiceConfig = { primaryKey: 'id', orderKey: 'order', allowOrdersOutOfRange: false };

export class OrderingService<T extends GenericObject> {
  private readonly _config: IOrderingServiceConfig;

  constructor(config?: IOrderingServiceConfig) {
    this._config = { ...defaultConfig, ...config };
    if (!this._config.primaryKey) this._config.primaryKey = defaultConfig.primaryKey;
    if (!this._config.orderKey) this._config.orderKey = defaultConfig.orderKey;
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
    target: I[], listOfOrdersChanges: Array<Required<T>> = [], config: IOrderingConfig = { },
  ): Array<I & Required<T>> {
    const { allowOrdersOutOfRange = this._config?.allowOrdersOutOfRange } = config;

    let result = this.reorderIfHasDuplicateOrEmptyOrders(target);
    if (!listOfOrdersChanges?.length) return result;

    this.hasInvalidOrderingItems(listOfOrdersChanges, true);

    const { min, max } = this.getOrderRange(result.map((item) => item[this.order]));

    listOfOrdersChanges.forEach((newItem) => {
      const prevItem = result.find((item) => item[this.pk] === newItem[this.pk]);
      if (!prevItem) throwHttpError.badRequest(`Invalid item with '${this.pk}' = ${newItem[this.pk]}`);

      const { [this.order]: newOrder } = newItem;
      const { [this.order]: prevOrder } = prevItem;

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

    return this.reorderIfHasDuplicateOrEmptyOrders(result);
  }

  /**
   *  Reorders target, depending on position of reordered item.
   *
   *  @param target - Reordered array of items.
   *  @param id - Reordered item primaryKey.
   *  @param prevIndex - Reordered item prev index.
   *  @param newIndex - Reordered item new index.
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
   *
   *  @param target Array in which to move the item.
   *  @param prevIndex Starting index of the item.
   *  @param newIndex Index to which the item should be moved.
   */
  public moveItemInArray<I extends T = T>(target: I[], prevIndex: number, newIndex: number, updateTarget = false): I[] {
    const result = this.moveItemInArrayExtended(target, prevIndex, newIndex, updateTarget);
    return !result ? target : result.array;
  }

  /**
   *  Returns new array w/ valid orders for those items without orders or w/ duplicates.
   *
   *  @param target - Target array.
   */
  public reorderIfHasDuplicateOrEmptyOrders<I extends T = T>(target: I[]): Array<I & Required<T>> {
    if (!this.hasDuplicateOrEmptyOrders(target)) return target as Array<I & Required<T>>;

    const parsed = parseTypes(target);
    let orders = this.getUniqueValues(parsed.map((item) => item[this.order]));
    let order: number;

    return parsed
      .map((item, i) => {
        const isDuplicate = parsed.find((unit, j) => j < i && unit[this.order] === item[this.order]);
        const isEmpty = !Object.hasOwnProperty.call(item, this.order) || isNil(item[this.order]);
        if (!isDuplicate && !isEmpty) return item;
        [order, orders] = this.getUniqueValue(orders);
        return { ...item, [this.order]: order };
      })
      .sort((a, b) => a[this.order] - b[this.order]) as Array<I & Required<T>>;
  }

  /**
   *  Checks whether provided array has items without order / empty orders. If has - returns first such item.
   *
   *  @param target - Target array.
   *  @param [throwError=true] - Whether to throw an Error instead of returing invalid item.
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
   *  @param target - Target array.
   *  @param [throwError=true] - Whether to throw an Error instead of returing invalid item.
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

  private moveItemInArrayExtended<I extends T = T>(
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

  private get pk(): string { return this._config?.primaryKey; }

  private get order(): string { return this._config?.orderKey; }

  private get confgiIsMsg(): string { return `Config is: ${JSON.stringify(this._config)}`; }

  private getUniqueValues(target: number[]): number[] { return Array.from(new Set(target)).filter((item) => !isNil(item)); }

  private getUniqueValue(values: number[]): [number, number[]] {
    const { min, max } = this.getOrderRange(values);
    let unique = range(min, max).find((item) => !values.includes(item));
    if (isNil(unique)) unique = min > 0 ? min - 1 : max + 1;
    return [unique, values.concat(unique)];
  }

  private getOrderRange(target: number[] = []): { min: number; max: number } {
    let min = target[0] ?? 0;
    let max = target[0] ?? 0;

    target.forEach((item) => {
      if (isNil(item)) return;
      if (item < min) min = item;
      if (item > max) max = item;
    });

    return { min, max };
  }

  private throwErrorIfNotArray<I>(target: I[]): void {
    const message = 'Invalid argument provided. It should be a valid Array';
    if (!Array.isArray(target)) throwHttpError({ status: 400, data: message, message });
  }
}

export const orderingService = new OrderingService<IOrderingItemDefault>();

export const {
  moveItemInArray,
  reorder,
  reorderByIndex,
  reorderIfHasDuplicateOrEmptyOrders,
  hasDuplicateOrEmptyOrders,
  hasInvalidOrderingItems,
} = orderingService;
