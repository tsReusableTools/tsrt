# TsRT: Store

[![npm version](https://img.shields.io/npm/v/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE)  [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)  [![Downloads](https://img.shields.io/npm/dm/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)


<!-- Store service using `rxjs` under the hood. -->
State management tool on top of great [RxJS](https://www.npmjs.com/package/rxjs).

## Usage

__Note!__ This package uses [RxJS](#rxjs-usage-examples), thus any rxjs operators and knowledge could and should be used to play with state.

##### Prepare State

It is necessary to provide `State` interfaces for better type safety and TS intellisense while using `set` and `get` methods.

```ts
interface IUser { id: number; name: string }
interface ITodo { id: number; title: string }
interface IState {
  user: IUser;
  todos: ITodo[];
}
```

##### Create store

```ts
import { Store } from '@tsrt/store';

export const store = new Store<IState>();
```

##### Listen for changes

```ts
import { store } from 'path/to/store';

store.get('user')
  .subscribe((user) => { /* Get notified here on any user updates */ })

store.get('user.name')
  .subscribe((userName) => { /* Get notified here on only user.name updates */ })

store.get('todos')
  .subscribe((todos) => { /* Get notified here on any todos updates */ })

store.get('todos.1')
  .subscribe((secondTodo) => { /* Get notified here on only second todo updates */ })

store.get('todos.1.title')
  .subscribe((secondTodoTitle) => { /* Get notified here on only second todo.title updates */ })
```

###### Selectors

```ts
store.get('user')
  .select((user) => ({ pk: user.id, firstName: user.name }))
  .subscribe((user) => { /* Get notified here on any user updates */ })

store.get('todos')
  .select((todo) => todo.id)
  .subscribe((todoIds) => { /* Get notified here on only todos updates, each value will be `number[]` (todo.id[]) */ })
```

###### RxJS usage examples

```ts
const todos$ = store.get('todos');
const todosTotal$ = todos$.pipe(map((val) => val.length));

todos$
  .pipe(
    withLatestFrom(todosTotal$)
  )
  .subscribe(([todos, total]) => { /* Get notified here on any todos updates. Receive todos and its total count */ })

todos$
  .pipe(
    map((val) => val.filter((todo) => todo.id % 2 !== 0)),
  )
  .subscribe((todos) => { /* Get notified here on any todos updates. Leave only todos with even id */ })

// And more ...
```

##### Provide test values

```ts
store.set('user', { id: 1, name: 'Me' });
store.set('todos', [{ id: 1, title: 'First Todo' }, { id: 2, title: 'Second Todo' }]);
store.get('todos.1.title').set('Updated Second Todo Title');
store.set('todos.1.title', 'Updated Again Second Todo Title');
```

##### Angular Example (optional)

[See on Stackblitz](https://stackblitz.com/edit/angular-tsrt-store?file=src/app/todos.component.ts)

### `assign` option

```ts
export interface IStoreOptions {
  /**
   * Whether to assign new object into existing in store or just replace it.
   *
   * @example
   * const user = new User({ id: 1, name: 'Me' });
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
   * @property [object] - Defines whether to assign when updating object values. @default false.
   * @property [array] - Defines whether to assign when updating array values. @default false.
   */
  assign?: {
      object?: boolean;
      array?: boolean;
  };
}
```

## Disclaimer

For quite long time there was quite frequent necessity to use some centralized store, but without big complexity and overhead, which is provided by popular modern tools, such as NgRX, NgXS, Redux, etc.

This is a bit enhanced revision of already used and existing Store, including some useful modern APIs and still tiny solution without any boilerplate.

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
