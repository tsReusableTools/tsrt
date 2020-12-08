/* eslint-disable @typescript-eslint/no-empty-interface */
import '@tsrt/types';

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
