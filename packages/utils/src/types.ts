/* eslint-disable @typescript-eslint/no-explicit-any */
import '@tsrt/types';

/** Type for msg aliases */
export type msgAlias = <T = any>(data?: T, code?: number | string) => IHttpError<T>

export interface IPagedData<T extends GenericObject = GenericObject> {
  value: T[];
  nextSkip?: number;
  total?: number;
}

/** Gets flatten type if Array of items of this type is provided. */
export type FlattenIfArray<T> = T extends Array<infer R> ? R : T

/** Gets keys of Object or elements of Array. */
export type KeyOf<T> = T extends GenericObject ? keyof T : T;
