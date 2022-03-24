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
  /** Current value for selected store property */
  value: T;

  select<R>(callbackFn: (value: T extends Array<infer U> ? U : T) => R): Observable<T extends Array<infer U> ? R[] : R>;
}

export interface IStorePropertySubject<T, V> extends IStoreSubject<T> {
  /**
   * Setter for selected store property.
   *
   * @param value - Value to set.
   * @param [options.assign] - Whether to assign to set value. @see IStoreOptions.
   */
  set(value: V, options?: ISetterOptions): void;
}

export interface ISetterOptions {
  assign?: boolean
}

export interface IStoreOptions {
  /**
   * Whether to assign new object into existing in store or just replace it.
   *
   * @example
   * const user = new User({ id: 1, name: 'Me' });
   * const todos = [{ id: 1, title: 'First' }];
   * const store = new Store({ user });
   *
   * // If `assign.object` === false
   * store.get('user').set({ name: 'You })
   * store.state.user // { name: 'You' }
   *
   * // If `assign.object` === true
   * store.get('user').set({ name: 'You })
   * store.state.user // User { id: 1, name: 'You' }
   *
   * // For `assign.array` its more obvious to use `false` (which is by default).
   * // If use `assign.array`: true - it will assgin existing array items and add those are not exist.
   * store.get('todos').set([
   *    { title: 'Updated First' },
   *    { title: 'New Second' },
   * ]);
   * store.state.todos // [{ id: 1, title: 'Updated First' }, { title: 'New Second' }];
   *
   * @property [object] - Defines whether to assign when updating object values. @default false.
   * @property [array] - Defines whether to assign when updating array values. @default false.
   */
  assign?: {
    object?: boolean;
    array?: boolean;
  }
}
