import { expect } from 'chai';
import { skip } from 'rxjs/operators';
import { PartialDeep } from 'type-fest';

import { RxStore, assignDeep } from '../src';

import {
  ITodo, Todo,
  ICountry, Country,
  ICity, City,
  IUser, User,
  IState, State,
  wait,
} from './models.spec';

const todos: Todo[] = [
  new Todo({ id: 1, title: 'F' }),
  new Todo({ id: 2, title: 'S' }),
];

const country = new Country({ code: 'UA' });
const city = new City({ name: 'Kiev', country });
const user = new User({ name: 'Me', city });
const version = 1;

const state = new State({ user, todos, version });
const store = new RxStore(state);

describe('Testing RxStore', () => {
  before(() => {
    //
  });

  beforeEach(() => {
    // Reset to defaults before each test
    store.set('user', user, { assign: false });
    store.set('todos', todos, { assign: false });
    store.set('version', version, { assign: false });
  });

  it(('RxStore.set(...): should set nested property value via setter'), () => {
    const name = 'Name 1';
    const versionUpdated = 2;

    store.set('user', { name });
    store.set('version', versionUpdated);

    expect(store.state.user).to.be.instanceOf(User);
    expect(store.state.user.get()).to.be.equal(name);

    expect(store.state.version).not.to.be.instanceOf(Number);
    expect(store.state.version).to.be.equal(versionUpdated);
  });

  it(('RxStore.set(..., { assign: false }): should set objectLike value to new value via setter'), () => {
    const name = 'Name 2';
    const versionUpdated = 2;

    store.set('user', { name }, { assign: false });
    store.set('version', versionUpdated, { assign: false });

    expect(store.state.user).not.to.be.instanceOf(User);
    expect(store.state.user.get).to.be.equal(undefined);

    expect(store.state.version).not.to.be.instanceOf(Number);
    expect(store.state.version).to.be.equal(versionUpdated);
  });

  it(('RxStore.get(prop?.nested).set(value): should set nested property value via property observable setter'), () => {
    const name = 'Name 3.1';

    store.get('user').set({ name });

    expect(store.state.user).to.be.instanceOf(User);
    expect(store.state.user.get()).to.be.equal(name);

    const name2 = 'Name 3.2';

    store.get('user.name').set(name2);

    expect(store.state.user).to.be.instanceOf(User);
    expect(store.state.user.get()).to.be.equal(name2);
  });

  it(('RxStore.get(prop?.nested).value: should get (nested) property value via property observable value'), () => {
    const stateValue = store.get().value;
    expect(stateValue).to.be.instanceOf(State);
    expect(store.state.user.name).to.be.equal(stateValue.user.name);

    const userValue = store.get('user').value;
    expect(userValue).to.be.instanceOf(User);
    expect(store.state.user.get()).to.be.equal(userValue.get());

    const userCityCountryCodeValue = store.get('user.city.country.code').value;
    expect(store.state.user.city.country.code).to.be.equal(userCityCountryCodeValue);
  });

  it('RxStore.get(prop?.nested): should fire event only when `prop?.nested` changes', () => {
    const nameObs = store.get('user.name');

    const names = ['Name 1', 'Name 2'];

    const changes: string[] = [];
    const subscription = nameObs
      .pipe(skip(1)) // Skip current state
      .subscribe((value) => { changes.push(value); });

    names.forEach((item) => nameObs.set(item));
    subscription.unsubscribe();

    expect(changes.length).to.be.equal(names.length);
    changes.forEach((item, index) => expect(item).to.be.equal(names[index]));
  });

  it(('RxStore.get(prop): should fire event on any nested property changes'), () => {
    const userObs = store.get('user');
    const userCityNameObs = store.get('user.city.name');

    let userChangesCount = 0;
    let userCityNameChangesCount = 0;

    const userSub = userObs
      .pipe(skip(1)) // Skip current state
      // .subscribe((val) => {
      //   console.log('user val >>>', val);
      //   userChangesCount++;
      // });
      .subscribe(() => { userChangesCount++; });

    const userCityNameSub = userCityNameObs
      .pipe(skip(1)) // Skip current state
      // .subscribe((val) => {
      //   console.log('city val >>>', val);
      //   userCityNameChangesCount++;
      // });
      .subscribe(() => { userCityNameChangesCount++; });

    const userChanges: Array<PartialDeep<IUser>> = [
      { name: 'Name' },
      { name: 'Name 2' },
      { city: { name: 'Kiev 2' } }, // This should be also calculated inside expect for userCityNameChangesCount
      { name: 'Name 3' },
      { city: { country: { code: 'UA 2' } } },
    ];

    const userCityNameChanges: string[] = [
      'Kiev 3',
      'Lviv 1',
      'Kiev',
    ];

    userChanges.forEach((item) => userObs.set(item));
    userCityNameChanges.forEach((item) => userCityNameObs.set(item));

    userSub.unsubscribe();
    userCityNameSub.unsubscribe();

    expect(userChangesCount).to.be.equal(userChanges.length + userCityNameChanges.length);
    expect(userCityNameChangesCount).to.be.equal(userCityNameChanges.length + 1);
  });

  it('RxStore.set(array?.nested): should correctly fire events and set values for arrays|nested items', () => {
    const todosObs
  });
});
