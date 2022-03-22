import { Observable } from 'rxjs';

export type GenericObject<T = any> = Record<string, T>;

// export type NestedKeys<T> = string;
export type NestedKeys<T> = T extends object
  ? {
      [Key in keyof T & (string | number)]: T[Key] extends object
        ? (T[Key] extends any[]
            // @ts-ignore
            ? `${Key}` | `${Key}.${number}` | `${Key}.${number}.${NestedKeys<T[Key][number]>}`
            : ExcludeFunctions<T[Key], `${Key}` | `${Key}.${string & NestedKeys<T[Key]>}`>)
        : `${Key}`
    }[keyof T & (string | number)]
  : never;

/* eslint-disable-next-line @typescript-eslint/ban-types */
export type ExcludeFunctions<T, ReturnType> = T extends Function ? never : ReturnType;

export interface IStoreObservable<T> extends Observable<T> {
// interface IStoreObservable<T> extends Observable<T extends Array<infer U> ? U : T> {
  value: T;
}

export interface IStorePropertyObservable<T, V> extends IStoreObservable<T> {
  set(value: V, options?: ISetterOptions): void;
}

export interface ISetterOptions {
  assign?: boolean
}
