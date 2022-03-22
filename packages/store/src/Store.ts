import { BehaviorSubject, Observable } from 'rxjs';
import { pluck, distinctUntilChanged } from 'rxjs/operators';
import { cloneDeep, assign, isNil, get, isEqual, toPath, set } from 'lodash';
import { Get, PartialDeep } from 'type-fest';

import { IStoreObservable, IStorePropertyObservable, ISetterOptions, NestedKeys, GenericObject } from './types';

/**
 * Lodash.assing but also for deeply nested properties
 *
 * @Note mutates `source` object.
 *
 * @param - source object, to assign values to.
 * @param - object, to assign values from.
 */
export function assignDeep<T extends GenericObject, R extends GenericObject>(source: T, newObject: R): T {
  Object.entries(newObject).forEach(([key, value]) => {
    if (typeof value === 'object') {
      assignDeep(source[key], value);
      assign(source[key], value);
      /* eslint-disable-next-line no-param-reassign */
    } else (source as GenericObject)[key] = value;
  });

  return source;
}

/* eslint-disable-next-line @typescript-eslint/ban-types */
export class RxStore<S extends object> {
  protected readonly _initialState: S;
  protected readonly _state: BehaviorSubject<S>;

  public constructor(
    _initialState: S = { } as S,
  ) {
    this._initialState = cloneDeep(_initialState);
    this._state = new BehaviorSubject(this._initialState);
  }

  public get state(): S {
    return cloneDeep(this._state.getValue());
  }

  public get state$(): Observable<S> {
    return this._state.asObservable();
  }

  /**
   *  Setter (reducer) for state
   *
   *  @param prop - Property to update.
   *  @param value - Value to update with.
   */
  public set<K extends keyof S>(
    prop: K,
    value: PartialDeep<S[K]>,
    { assign: shoudAssign = true }: ISetterOptions = { },
  ): void {
    const computedValue = shoudAssign && typeof value === 'object' ? assignDeep(this.state[prop], value) : value;
    this._state.next(assign(this.state, { [prop]: cloneDeep(computedValue) }));
  }

  /**
   *  Getter for current state/state property observable$
   *
   *  @param prop - Optional state property to get observable for.
   */
  public get(): IStoreObservable<S>;
  public get<P extends NestedKeys<S>>(prop: P): IStorePropertyObservable<Get<S, P>, PartialDeep<Get<S, P>>>
  public get<P extends NestedKeys<S>>(prop?: P): IStoreObservable<S> | IStorePropertyObservable<Get<S, P> | S, PartialDeep<Get<S, P>>> {
    const result = isNil(prop)
      ? this.state$ as IStoreObservable<S>
      : this.state$.pipe(
        distinctUntilChanged((a, b) => isEqual(get(a, prop), get(b, prop))),
        pluck(...toPath(prop)),
        // switchMap((x) => Array.isArray(x) ? of(...x) : of(x))
      ) as IStorePropertyObservable<Get<S, P> | S, PartialDeep<Get<S, P>>>;

    const getValue = (): S => (isNil(prop) ? this.state : get(this.state, prop) as S);
    Object.defineProperty(result, 'value', { get: getValue });

    if (!isNil(prop)) {
      (result as IStorePropertyObservable<Get<S, P> | S, PartialDeep<Get<S, P>>>).set = (
        value,
        { assign: shoudAssign = true } = { },
      ) => {
        const computedValue = shoudAssign && typeof value === 'object' ? assignDeep(result.value, value) : value;
        this._state.next(set(this.state, prop, cloneDeep(computedValue)));
      };
    }

    return result;
  }
}
