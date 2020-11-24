import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { IState } from './types';

export class Store<T extends GenericObject = IState> {
  private _state = new BehaviorSubject<T>({} as T);

  constructor(
    private readonly InitialState: Constructor<T>,
  ) {}

  /** Current state */
  public get state(): T {
    return this.cloneDeep(this._state.getValue());
  }

  /** State observable */
  public get state$(): Observable<T> {
    return this._state.asObservable();
  }

  /**
   *  Subscribe for state updates.
   *
   *  @param [next] - Handler for each value emitted by the observable.
   *  @param [error] - Handler for each error emitted by the observable.
   *  @param [complete] - Handler for observable completeness.
   */
  public subscribe(next?: (value: T) => void, error?: (error: Error) => void, complete?: () => void): Subscription {
    return this.state$.subscribe(next, error, complete);
  }

  /**
   *  Unsubscribe state observable.
   *
   *  @param subscription- State subscription.
   */
  public unsubscribe(subscription: Subscription): void {
    if (subscription) subscription.unsubscribe();
  }

  /**
   *  Setter (reducer) for state.
   *
   *  @param prop - Property to update.
   *  @param value - Value to update with.
   */
  public set<K extends keyof T>(prop: K, value: T[K]): void {
    if (!Object.hasOwnProperty.call(new this.InitialState(), prop)) {
      throw new Error('There is no such property in App State');
    }

    if (Object.hasOwnProperty.call(new this.InitialState(), prop)) {
      this._state.next({ ...this.state, [prop]: this.cloneDeep(value) });
    }
  }

  /**
   *  Getter for current state or state property.
   *
   *  @param prop - Optional state property to get.
   */
  public get(): T;
  public get<K extends keyof T>(prop: K): T[K];
  public get<K extends keyof T>(prop?: K): T | T[K] {
    if (!prop) return this._state.getValue();

    return this.cloneDeep(this._state.getValue()[prop]);
  }

  private cloneDeep<C>(value: C): C {
    return JSON.parse(JSON.stringify(value));
  }
}
