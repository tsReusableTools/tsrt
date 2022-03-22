import { BehaviorSubject, Observable } from 'rxjs';
import { pluck, distinctUntilChanged } from 'rxjs/operators';
import { cloneDeep, assign, isNil, get, isEqual, toPath, set } from 'lodash';
import { Get, PartialDeep } from 'type-fest';

import { IStoreSubject, IStorePropertySubject, ISetterOptions, NestedKeys, GenericObject, IRxStoreOptions } from './types';

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
export class RxStore<S extends object> {
  protected readonly _initialState: S;
  protected readonly _state: BehaviorSubject<S>;
  protected readonly _options: IRxStoreOptions;

  public constructor(
    _initialState: S = { } as S,
    _options: IRxStoreOptions = { },
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
   *  @param prop - Property to update.
   *  @param value - Value to update with.
   */
  public set<K extends keyof S>(
    prop: K,
    value: PartialDeep<S[K]>,
    { assign: shoudAssign = this._getAssignOptionValue(value) }: ISetterOptions = { },
  ): void {
    const computedValue = shoudAssign && typeof value === 'object' ? assignDeep(this.state[prop], value) : value;
    this._state.next(assign(this.state, { [prop]: cloneDeep(computedValue) }));
  }

  /**
   *  Getter for current state/state property observable$
   *
   * @example
   * const todosSubject = store.get(propertyName);
   * todos.value; // Current value;
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
        pluck(...toPath(prop)),
        // switchMap((x) => Array.isArray(x) ? of(...x) : of(x))
      ) as IStorePropertySubject<Get<S, P> | S, PartialDeep<Get<S, P>>>;

    const getValue = (): S => (isNil(prop) ? this.state : get(this.state, prop) as S);
    Object.defineProperty(result, 'value', { get: getValue });

    if (!isNil(prop)) {
      (result as IStorePropertySubject<Get<S, P> | S, PartialDeep<Get<S, P>>>).set = (
        value,
        { assign: shoudAssign = this._getAssignOptionValue(value) } = { },
      ) => {
        const computedValue = shoudAssign && typeof value === 'object' ? assignDeep(result.value, value) : value;
        this._state.next(set(this.state, prop, cloneDeep(computedValue)));
      };
    }

    return result;
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
