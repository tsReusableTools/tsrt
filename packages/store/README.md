# TsRT: Store

[![npm version](https://img.shields.io/npm/v/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE)  [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)  [![Downloads](https://img.shields.io/npm/dm/@tsrt/store.svg)](https://www.npmjs.com/package/@tsrt/store)


<!-- Store service using `rxjs` under the hood. -->
State management tool on top of great [RxJS](https://www.npmjs.com/package/rxjs).

## Usage


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
import { RxStore } from '@tsrt/store';

export const store = new RxStore<IState>();
```

##### Listen for changes

```ts
import { store } from 'path/to/store';

store.get('user')
  .subscrbe((user) => { /* Get notified here upon any user updates */ })

store.get('user.name')
  .subscrbe((userName) => { /* Get notified here upon only user.name updates */ })

store.get('todos')
  .subscrbe((todos) => { /* Get notified here upon any todos updates */ })

store.get('todos.1')
  .subscrbe((secondTodo) => { /* Get notified here upon only second todo updates */ })

store.get('todos.1.title')
  .subscrbe((secondTodoTitle) => { /* Get notified here upon only second todo.title updates */ })
```

##### Provide test values

```ts
store.set('user', { id: 1, name: 'Me' });
store.set('todos', [{ id: 1, title: 'First Todo' }, { id: 2, title: 'Second Todo' }]);
store.get('todos.1.title').set('Updated Second Todo Title');
```

##### Angular Example (optional)

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { store } from 'path/to/store';

@NgModule({
  /* ... */
  declarations: [ /* ... */, TodosComponent],
  providers: [ /* ... */, { provide: RxStore, useValue: store }]
})
export class AppModule { }

// todos.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { RxStore } from '@tsrt/store';

import { IState } from 'path/to/state';

@Component({
  selector: 'todos',
  template: `
    <button (click)="handleAddTodo()">ADd Todo</button>

    <div *ngFor="let todo of evenTodos$ | async">
      id - {{ todo.id }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodosComponent {
  public evenTodos$ = evenTodosSelector(this.store);

  constructor(
    public readonly store: RxStore<IState>,

  ) { }

  public handleAddTodo(): void {
    const prevTodos = this.store.state.todos ?? [];
    const nextId = prevTodos.length ? prevTodos[prevTodos.length - 1].id + 1 : 1;
    const todo = { id: nextId, title: 'Dynamically added todo' };
    const todos = prevTodos.concat(todo);
    // this.store.set('todos', todos);
    this.store.get('todos').set(todos);
  }
}

function evenTodosSelector(store: RxStore<IState>) {
  return store
    .get('todos')
    .pipe(
      map((todos) => {
        return todos?.filter((item) => item.id % 2 === 0);
      }),
      filter((todos) => !!todos?.length),
    )
}
```

### `assign` option

```ts
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
  };
}
```

## Disclaimer

For quite long time there was quite frequent necessity to use some centralized store, but without big complexity and overhead, which is provided by popular modern tools, such as NgRX, NgXS, Redux, etc.

This is a bit enhanced revision of already used and existing Store, including some useful modern APIs and still tiny solution without any boilerplate.

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
