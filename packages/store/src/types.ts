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

export interface IStoreSubject<T> extends Observable<T> {
// interface IStoreSubject<T> extends Observable<T extends Array<infer U> ? U : T> {
  /** Current value for selected store property */
  value: T;
}

export interface IStorePropertySubject<T, V> extends IStoreSubject<T> {
  /**
   * Setter for selected store property.
   *
   * @param value - Value to set.
   * @param [options.assign] - Whether to assign to set value. @see IRxStoreOptions.
   */
  set(value: V, options?: ISetterOptions): void;
}

export interface ISetterOptions {
  assign?: boolean
}

export interface IRxStoreOptions {
  /**
   * Whether to assign new object into existing in store or just replace it.
   *
   * @example
   * const user = new User({ id: 1, name: 'Me' });
   * const store = new RxStore({ user });
   *
   * // If `assign.object` === false
   * store.get('user').set({ name: 'You })
   * store.state.user // { name: 'You' }
   *
   * // If `assign.object` === true
   * store.get('user').set({ name: 'You })
   * store.state.user // User { id: 1, name: 'You' }
   *
   * @property [object] - Defines whether to assign when updating object values. @default false.
   * @property [array] - Defines whether to assign when updating array values. @default false.
   */
  assign?: {
    object?: boolean;
    array?: boolean;
  }
}
