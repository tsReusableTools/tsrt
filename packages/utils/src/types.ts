/* eslint-disable @typescript-eslint/no-explicit-any */
import '@tsd/types';

/** Type for msg aliases */
export type msgAlias = <T = any>(data?: T, code?: number | string) => IHttpError<T>

/** Interface for item, which could be reordered */
export interface IOrderedItem extends GenericObject {
  id: number;
  order: number;
}
