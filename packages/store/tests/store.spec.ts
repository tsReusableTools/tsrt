import { expect } from 'chai';
import { skip, filter } from 'rxjs/operators';
import { PartialDeep } from 'type-fest';

import { Store, isEqual } from '../src';

import { Todo, Country, City, User, State, state } from './models';

const store = new Store(state, { assign: { object: true } });

describe('Testing Store:', () => {
  beforeEach(() => { store.reset(); });

  it(('Store.set(prop?.nested): should set nested property value via setter'), () => {
    const name = 'Name 1.1';
    const versionUpdated = 2;

    store.set('user', { name });
    store.set('version', versionUpdated);

    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.name).to.be.equal(name);
    expect(store.state.user.get).to.be.equal(undefined);
    expect(store.state.user.city.name).to.be.equal(state.user.city.name);
    expect(store.state.version).to.be.equal(versionUpdated);

    // Nested selector
    const cityName = 'cityName';
    store.set('user.city', { name: cityName });
    expect(store.state.user.city).not.to.be.instanceOf(City);
    expect(store.state.user.city.name).to.be.equal(cityName);
    expect(store.state.user.city.country).not.to.be.instanceOf(Country);
    expect(store.state.user.city.country.code).to.be.equal(state.user.city.country.code);

    // assign: false
    const nameReassign = 'Name 1.3';
    const versionUpdatedReassign = 3;

    store.set('user', { name: nameReassign }, { assign: false });
    store.set('version', versionUpdatedReassign, { assign: false });

    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.get).to.be.equal(undefined);
    expect(store.state.user.name).to.be.equal(nameReassign);
    expect(store.state.user.city).to.be.equal(undefined);
    expect(store.state.version).to.be.equal(versionUpdatedReassign);
  });

  it(('Store.get(prop?.nested).set(value): should set nested property value via property observable setter'), () => {
    const name = 'Name 3.1';
    store.get('user').set({ name });
    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.get).to.be.equal(undefined);
    expect(store.state.user.name).to.be.equal(name);

    const name2 = 'Name 3.2';
    store.reset();
    store.get('user.name').set(name2);
    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.get).to.be.equal(undefined);
    expect(store.state.user.name).to.be.equal(name2);

    const cityName = 'CityName';
    store.reset();
    store.get('user.city').set({ name: cityName });
    expect(store.state.user.city).not.to.be.instanceOf(City);
    expect(store.state.user.city.name).to.be.equal(cityName);

    const name3 = 'Name 3.3';
    store.reset();
    store.get('user').set({ name: name3 }, { assign: false });
    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.get).to.be.equal(undefined);
    expect(store.state.user.name).to.be.equal(name3);
    expect(store.state.user.city).to.be.equal(undefined);
  });

  it('Store.get(prop).select(callbackFn): should correctly select (transform) nested property observable$ by callbackFn', () => {
    const todoIds$ = store.get('todos').select((todo) => todo.id);

    const todoIdsSub = todoIds$
      .subscribe((value) => {
        value.forEach((item) => expect(typeof item === 'number').to.be.equal(true));
      });

    store.set('todos', [{ id: 123 }]);

    todoIdsSub.unsubscribe();
  });

  it(('Store.get(prop?.nested).value: should get (nested) property value via property observable value'), () => {
    const stateValue = store.get().value;
    expect(stateValue).not.to.be.instanceOf(State);
    expect(store.state.user.name).to.be.equal(stateValue.user.name);
    expect(store.state.todos.length).to.be.equal(state.todos.length);
    expect(isEqual(stateValue, state)).to.be.equal(true);

    const userValue = store.get('user').value;
    expect(userValue).not.to.be.instanceOf(User);
    expect(isEqual(userValue, stateValue.user)).to.be.equal(true);

    const userCityCountryCodeValue = store.get('user.city.country.code').value;
    expect(store.state.user.city.country.code).to.be.equal(userCityCountryCodeValue);
  });

  it('Store.get(prop?.nested): should fire event only when `prop?.nested` changes', () => {
    const nameObs = store.get('user.name');

    const names = ['Name 1', 'Name 2'];

    const changes: string[] = [];
    const subscription = nameObs
      .pipe(skip(1)) // Skip current state
      .subscribe((value) => { changes.push(value); });

    // names.forEach((item) => nameObs.set(item, { assign: false }));
    names.forEach((item) => nameObs.set(item));
    subscription.unsubscribe();

    expect(changes.length).to.be.equal(names.length);
    changes.forEach((item, index) => expect(item).to.be.equal(names[index]));
  });

  it(('Store.get(prop): should fire event on any nested property changes'), () => {
    const userObs = store.get('user');
    const userCityNameObs = store.get('user.city.name');

    let userChangesCount = 0;
    let userCityNameChangesCount = 0;

    const userChanges: Array<PartialDeep<User>> = [
      { name: 'Name' },
      { name: 'Name' },
      { name: 'Name 2' },
      { city: { name: 'Kiev 2' } }, // This should be also calculated inside expect for userCityNameChangesCount
      { name: 'Name 3' },
      { city: { country: { code: 'UA 2' } } },
    ];

    const userCityNameChanges: string[] = [
      'Kiev 3',
      'Kiev 3',
      'Lviv 1',
      'Kiev',
    ];

    const userSub = userObs
      .pipe(skip(1)) // Skip current state
      .subscribe(() => { userChangesCount++; });

    const userCityNameSub = userCityNameObs
      .pipe(skip(1)) // Skip current state
      .subscribe(() => { userCityNameChangesCount++; });

    userChanges.forEach((item) => userObs.set(item));
    userCityNameChanges.forEach((item) => userCityNameObs.set(item));

    userSub.unsubscribe();
    userCityNameSub.unsubscribe();

    const userChangesWhichAffectCityName = userChanges.filter((item) => !!item?.city?.name);
    const uniqueUserCityNameChanges = Array.from(new Set(userCityNameChanges));

    expect(userChangesCount).to.be.equal(userChanges.length + userCityNameChanges.length);
    expect(userCityNameChangesCount).to.be.equal(uniqueUserCityNameChanges.length + userChangesWhichAffectCityName.length);
  });

  it('Store.get(array?.nested).set(): should correctly fire events and set values for arrays|nested items', () => {
    const todosObs = store.get('todos');
    const secondTodoObs = store.get('todos.1');
    const secondTodoTitleObs = store.get('todos.1.title');

    let todosChangesCount = 0;
    let secondTodoChangesCount = 0;
    let secondTodoTitleChangesCount = 0;

    const todosChanges: Array<Array<PartialDeep<Todo>>> = [
      [
        new Todo({ id: 1, title: 'Frist Array 1' }),
      ],
      [
        new Todo({ id: 2, title: 'Second Array 1' }),
        new Todo({ id: 3, title: 'Second Array 2' }),
        { id: 4 },
      ],
    ];
    const secondTodoChanges: Array<PartialDeep<Todo>> = [
      { id: 123 },
      { title: 'Todo Title Changed' },
    ];
    const secondTodoTitleChanges: string[] = [
      'Title 1',
      'Title 2',
    ];

    const todosSub = todosObs
      .pipe(skip(1)) // Skip current state
      .subscribe(() => todosChangesCount++);

    const secondTodoSub = secondTodoObs
      .pipe(
        skip(1), // Skip current state
        filter((item) => !!item), // Filter out those events when `todos` has less than 2 elements
      )
      .subscribe(() => secondTodoChangesCount++);

    const secondTodoTitleSub = secondTodoTitleObs
      .pipe(
        skip(1), // Skip current state
        filter((item) => !!item), // Filter out those events when `todos` has less than 2 elements
      )
      .subscribe(() => secondTodoTitleChangesCount++);

    // todosChanges.forEach((item) => todosObs.set(item, { assign: true }));
    todosChanges.forEach((item) => todosObs.set(item));
    secondTodoChanges.forEach((item) => secondTodoObs.set(item));
    secondTodoTitleChanges.forEach((item) => secondTodoTitleObs.set(item));
    // todosChanges.forEach((item) => store.set('todos', item, { assign: true }));
    todosChanges.forEach((item) => store.set('todos', item));

    todosSub.unsubscribe();
    secondTodoSub.unsubscribe();
    secondTodoTitleSub.unsubscribe();

    const todoChangesWhichAffectSecondTodo = todosChanges.filter((item) => item.length >= 2);
    const secondTodoChangesWhichAffectTodoTitle = secondTodoChanges.filter((item) => !!item.title);

    expect(todosChangesCount).to.be.equal((todosChanges.length * 2) + secondTodoChanges.length + secondTodoTitleChanges.length);
    expect(secondTodoChangesCount).to.be.equal(
      (todoChangesWhichAffectSecondTodo.length * 2)
      + secondTodoChanges.length
      + secondTodoTitleChanges.length,
    );
    expect(secondTodoTitleChangesCount).to.be.equal(
      (todoChangesWhichAffectSecondTodo.length * 2)
      + secondTodoChangesWhichAffectTodoTitle.length
      + secondTodoTitleChanges.length,
    );
  });
});
