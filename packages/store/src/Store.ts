import { BehaviorSubject, Observable } from 'rxjs';
import { pluck, distinctUntilChanged, map } from 'rxjs/operators';
import { cloneDeep, assign, isNil, get, isEqual, toPath, set } from 'lodash';
import { Get, PartialDeep } from 'type-fest';

import { IStoreSubject, IStorePropertySubject, ISetterOptions, NestedKeys, GenericObject, IStoreOptions } from './types';

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
    if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(source, key)) {
      assignDeep(source[key], value);
      assign(source[key], value);
      /* eslint-disable-next-line no-param-reassign */
    } else (source as GenericObject)[key] = value;
  });

  return source;
}

/* eslint-disable-next-line @typescript-eslint/ban-types */
export class Store<S extends object> {
  protected readonly _initialState: S;
  protected readonly _state: BehaviorSubject<S>;
  protected readonly _options: IStoreOptions;

  public constructor(
    _initialState: S = { } as S,
    _options: IStoreOptions = { },
  ) {
    this._initialState = cloneDeep(_initialState);
    this._state = new BehaviorSubject(this._initialState);

    this._options = {
      assign: {
        object: _options.assign?.object ?? false,
        array: _options.assign?.array ?? false,
      },
    };
  }

  /** Current state getter */
  public get state(): S {
    return cloneDeep(this._state.getValue());
  }

  /** State obsevable getter */
  public get state$(): Observable<S> {
    return this._state.asObservable();
  }

  /** Resets to `initialValue` provided on Store instance creation. */
  public reset(): void {
    this._state.next(cloneDeep(this._initialState));
  }

  /**
   *  Setter (reducer) for state
   *
   *  @param prop - Property path to update.
   *  @param value - Value to update with.
   */
  public set<P extends NestedKeys<S>>(
    prop: P,
    value: PartialDeep<Get<S, P>>,
    { assign: shoudAssign = this._getAssignOptionValue(value) }: ISetterOptions = { },
  ): void {
    this._setState(prop, value, shoudAssign);
  }

  /**
   *  Getter for current state/state property observable$
   *
   * @example
   * const todosSubject = store.get(propertyName);
   * todos.value; // Current value;
   * todos.select((todo) => todo.id) // Transform to some specific observable
   * todos.set([...], { assign?: boolean }); // Sets|assigns to selected store property
   *
   * const secondTodoTitleSubject = store.get('todos.1.title');
   * secondTodoTitleSubject.value // `title` value of `second` item in `todos` list.
   * secondTodoTitleSubject.subscribe(...) // Subscrbe on only selected property updates.
   * secondTodoTitleSubject.set('New Title')
   *
   *  @param prop - Optional state property to get observable for.
   */
  public get(): IStoreSubject<S>;
  public get<P extends NestedKeys<S>>(prop: P): IStorePropertySubject<Get<S, P>, PartialDeep<Get<S, P>>>
  public get<P extends NestedKeys<S>>(prop?: P): IStoreSubject<S> | IStorePropertySubject<Get<S, P> | S, PartialDeep<Get<S, P>>> {
    const result = isNil(prop)
      ? this.state$ as IStoreSubject<S>
      : this.state$.pipe(
        distinctUntilChanged((a, b) => isEqual(get(a, prop), get(b, prop))),
        // distinctUntilChanged((a, b) => get(a, prop) === get(b, prop)),
        // distinctUntilChanged(),
        pluck(...toPath(prop)),
        // switchMap((x) => Array.isArray(x) ? of(...x) : of(x))
      ) as IStorePropertySubject<Get<S, P> | S, PartialDeep<Get<S, P>>>;

    this._defineValueGetter(result, prop);
    this._defineValueSelector(result);
    this._defineValueSetter(result, prop);

    return result;
  }

  protected _defineValueGetter<T>(target: T, prop: string): void {
    const valueGetter = (): S => (isNil(prop) ? this.state : get(this.state, prop) as S);
    Object.defineProperty(target, 'value', { get: valueGetter });
  }

  protected _defineValueSelector<T extends IStoreSubject<S>>(target: T): void {
    const select = <R>(callbackFn: (value: S extends Array<infer U> ? U : S) => R) => target.pipe(
      map((val) => (Array.isArray(val) ? val.map(callbackFn) : callbackFn(val as never))),
    );

    Object.defineProperty(target, 'select', { value: select });
  }

  protected _defineValueSetter<T, P extends string>(target: T, prop: P): void {
    if (isNil(prop)) return;

    const valueSetter = (
      value: PartialDeep<Get<S, P>>, { assign: shoudAssign = this._getAssignOptionValue(value) } = { },
    ) => this._setState(prop, value, shoudAssign);
    Object.defineProperty(target, 'set', { value: valueSetter });
  }

  protected _setState<P extends string | number | symbol, T>(prop: P, value: T, shoudAssign: boolean): void {
    const computedValue = shoudAssign && typeof value === 'object' ? assignDeep(get(this.state, prop), value) : value;
    this._state.next(set(this.state, prop, cloneDeep(computedValue)));
  }

  protected _getAssignOptionValue<T>(value: T): boolean {
    switch (true) {
      case Array.isArray(value):
        return this._options.assign.array;

      case typeof value === 'object':
        return this._options.assign.object;

      default:
        return false;
    }
  }
}
