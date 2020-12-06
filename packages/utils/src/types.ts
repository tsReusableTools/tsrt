/* eslint-disable @typescript-eslint/no-explicit-any */
import '@tsrt/types';

/** Type for msg aliases */
export type msgAlias = <T = any>(data?: T, code?: number | string) => IHttpError<T>

export interface IPagedData<T extends GenericObject = GenericObject> {
  value: T[];
  nextSkip?: number;
  total?: number;
}

export interface IOrderingItemDefault {
  id: number;
  order?: number;
}

export interface IOrderingConfig {
  allowOrdersOutOfRange?: boolean;
}

export interface IOrderingServiceConfig extends IOrderingConfig {
  primaryKey?: string;
  orderKey?: string;
}
