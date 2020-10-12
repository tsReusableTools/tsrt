import { IOrderedItem } from './types';
import { parseTypes } from './utils';
import { throwHttpError } from './HttpError';

/**
 *  Checks whether array of ordered items has items withour order / with duplicating orders
 *
 *  @param array - Array of items
 */
export const hasItemsWithoutOrderOrWithEqualOrders = <T extends GenericObject = IOrderedItem>(
  array: T[],
): boolean => {
  let itemsWithoutOrder = false;
  let itemsWithEqualOrders = false;

  array.forEach((item, i) => {
    if (itemsWithoutOrder || itemsWithEqualOrders) return;
    if (!Object.hasOwnProperty.call(item, 'order')) return;
    if (Object.hasOwnProperty.call(item, 'order') && item.order === null) itemsWithoutOrder = true;
    if (
      (array[i + 1] && item.order === array[i + 1].order)
      || (array[i - 1] && item.order === array[i - 1].order)
    ) itemsWithEqualOrders = true;
  });

  return itemsWithoutOrder || itemsWithEqualOrders;
};

/**
 *  Provides order for those items, which doesn't has it, according to their position in array
 *
 *  @param array - Original array with items
 */
export const provideOrderForItemsWithoutIt = <T extends GenericObject = IOrderedItem>(array: T[]): T[] => {
  let invalidArg = false;
  let allWithOrders = true;
  array.forEach((item) => {
    if (invalidArg) return;
    if (Object.hasOwnProperty.call(item, 'order') && item.order === null) allWithOrders = false;
    if (!item.order && item.order !== 0 && item.order !== null) invalidArg = true;
  });
  if (invalidArg || allWithOrders) return array;

  const sorted: T[] = [];
  const unSorted: T[] = [];

  array.forEach((item) => {
    if (item.order === null) unSorted.push(parseTypes(item));
    else sorted.push(parseTypes(item));
  });

  sorted.sort((a, b) => a.order - b.order);

  const result = [...sorted, ...unSorted];

  result.forEach((item, i) => {
    if (item.order === null && result[i - 1] && (result[i - 1].order || result[i - 1].order === 0)) {
      result[i] = { ...item, order: parseTypes(result[i - 1].order) + 1 };
    } else if (item.order === null && !result[i - 1]) {
      result[i] = { ...item, order: 0 };
    }
  });

  return result;
};

/**
 *  Checks for duplicating orders and correctly fixes this
 *
 *  @param array - Original array with items
 */
export const reorderItemsWithDuplicatingOrders = <T extends GenericObject = IOrderedItem>(array: T[]): T[] => {
  let duplicates = false;
  let result = [...parseTypes(array)];

  result.sort((a, b) => b.order - a.order);

  result.forEach((item, i) => {
    if (result[i + 1] && item.order === result[i + 1].order) {
      result[i] = { ...item, order: parseTypes(item.order) + 1 };
      duplicates = true;
    }
  });

  if (duplicates) result = reorderItemsWithDuplicatingOrders(result);

  result.sort((a, b) => a.order - b.order);
  return result;
};

/**
 *  Reorders array of items
 *
 *  @param reorderedArray - Array of items with new orders
 *  @param originalData - Original array of items before reordering
 *
 *  @returns reordered array of items
 */
export const reorderItemsInArray = <I extends IOrderedItem>(
  reorderedArray: I[], originalData: I[],
): I[] => {
  let result = [...parseTypes(originalData)];
  let withoutOrders = false;

  originalData.forEach((item) => {
    if (item.order === null) withoutOrders = true;
  });

  if (withoutOrders || !reorderedArray || !reorderedArray.length) {
    return reorderItemsWithDuplicatingOrders(provideOrderForItemsWithoutIt(originalData));
  }

  let min = 0;
  let max = 0;

  result.forEach((item) => {
    if (item.order < min) min = item.order;
    if (item.order > max) max = item.order;
  });

  reorderedArray.forEach((newReorderingItem) => {
    /* eslint-disable-next-line */
    if (!newReorderingItem || (!newReorderingItem.order && newReorderingItem.order !== 0) || !newReorderingItem.id) {
      throwHttpError.badRequest('Invalid new ordered array. Id and order are necessary fields for each item and should not be negative');
      return;
    }

    const prevReorderingItem = result.find((item) => item.id === newReorderingItem.id);
    if (!prevReorderingItem) {
      throwHttpError.badRequest(`Invalid new ordered array. Provided invalid item id: ${newReorderingItem.id}`);
      return;
    }

    // const prevReorderingItemOrder = result.find((item) => item.order === newReorderingItem.order);
    // if (!prevReorderingItemOrder) {
    //   response = respond(
    //     400, `Invalid new ordered array. Provided invalid item order: ${newReorderingItem.order}`,
    //   );
    //   return;
    // }

    if (newReorderingItem.order > max || newReorderingItem.order < min) {
      throwHttpError.badRequest(`Invalid new ordered array. Provided invalid item order: ${newReorderingItem.order}`);
      return;
    }

    const reordered = result.map((item) => {
      if (item.id === newReorderingItem.id) return { ...item, order: newReorderingItem.order };
      if (newReorderingItem.order > prevReorderingItem.order) {
        if (item.order < prevReorderingItem.order || item.order > newReorderingItem.order) return item;

        return { ...item, order: item.order - 1 };
      }

      if (newReorderingItem.order < prevReorderingItem.order) {
        if (item.order < newReorderingItem.order || item.order > prevReorderingItem.order) return item;

        return { ...item, order: item.order + 1 };
      }

      return item;
    });

    reordered.sort((a: GenericObject, b: GenericObject) => a.order - b.order);
    result = reorderItemsWithDuplicatingOrders(reordered);
  });

  return result;
};

/**
 *  Updates items order in array, depending on position of reordered item
 *
 *  @param id - Reordered item id
 *  @param prevIndex - Reordered item prev index
 *  @param newIndex - Reordered item new index
 *  @param array - Reordered array of items
 */
export function updateItemsOrderInArray<T extends IOrderedItem = IOrderedItem>(
  id: number, prevIndex: number, newIndex: number, array: T[],
): T[] {
  // if (!(id && id !== 0) || (!prevIndex && prevIndex !== 0) || (!newIndex && newIndex !== 0) || !array) return;
  if ((!id && id !== 0) || (!prevIndex && prevIndex !== 0) || (!newIndex && newIndex !== 0) || !array) return;

  const result = array.map((item, i) => {
    if (prevIndex < newIndex) {
      if (i < prevIndex || i > newIndex) return { ...item };
      if (item.id === id) return { ...item, order: array[i - 1].order };

      return { ...item, order: item.order - 1 };
    }

    if (prevIndex > newIndex) {
      if (i > prevIndex || i < newIndex) return { ...item };
      if (item.id === id) return { ...item, order: array[i + 1].order };

      return { ...item, order: item.order + 1 };
    }

    return { ...item };
  });

  result.sort((a, b) => a.order - b.order);
  return result;
}

/**
 *  Gets reordered item from array, depending on its position.
 *
 *  @param id - Reordered item id.
 *  @param prevIndex - Reordered item prev index or list of new orders.
 *  @param newIndex - Reordered item new index.
 *  @param array - Reordered array of items.
 *  @param [emitWholeItemValue=false] - Whether to emit whole item value instead of just [id, order] list.
 */
export function getReorderedItem<T extends IOrderedItem = IOrderedItem>(
  id: number, prevIndex: number | T[], newIndex?: number, array?: T[], emitWholeItemValue = false,
): IOrderedItem {
  // if (
  //   (typeof prevIndex === 'number'
  //   && (!(id && id !== 0) || (!prevIndex && prevIndex !== 0) || (!newIndex && newIndex !== 0) || !array))
  //   || !prevIndex
  // ) return;
  if (
    (!id && id !== 0) || (!prevIndex && prevIndex !== 0)
    || (typeof prevIndex === 'number' && ((!newIndex && newIndex !== 0) || !array))
  ) return;

  const reordered = typeof prevIndex === 'number'
    ? updateItemsOrderInArray(id, prevIndex, newIndex, array)
    : prevIndex;

  const reorderedItem = reordered.find((item) => item.id === id);

  const result: IOrderedItem = emitWholeItemValue
    ? { ...reorderedItem }
    : { id: reorderedItem.id, order: reorderedItem.order };

  return result;
}
