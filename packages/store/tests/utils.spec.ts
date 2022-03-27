import { expect } from 'chai';

import { assignDeep, cloneDeep, toPath, isEqual, get, set } from '../src';

import { Country, City, User, state } from './models';

describe('Testing utils:', () => {
  it('toPath(): should correctly convert string to path', () => {
    const string = 'state.todos.1.user.todos[1].name';
    const expected = ['state', 'todos', '1', 'user', 'todos', '1', 'name'];
    const result = toPath(string, { brackets: true });

    result.forEach((item, index) => { expect(item).to.be.equal(expected[index]); });
  });

  it('get(): should get deeply nested property', () => {
    const notFoundText = 'NotFound';
    const foundUserCity = get(state, 'user.city');
    const foundCountryCode = get(state, 'user.city.country.code');
    const foundTodoTitle = get(state, 'todos.1.title');
    const notFoundTodoTitle = get(state, 'todos.123.title');
    const notFoundTodoTitleText = get(state, 'todos.123.title', notFoundText);

    expect(foundUserCity).to.be.instanceOf(City);
    expect(foundCountryCode).to.be.equal(state.user.city.country.code);
    expect(foundTodoTitle).to.be.equal(state.todos[1].title);
    expect(notFoundTodoTitle).to.be.equal(undefined);
    expect(notFoundTodoTitleText).to.be.equal(notFoundText);
  });

  it('set({ mutate: false, assign: false }): should set deeply nested value, without mutation of original object', () => {
    const stateCopy = cloneDeep(state, { prototypes: true });

    const userName = 'You';
    const cityName = 'NewCity';
    const stateChangeUser = set(stateCopy, 'user', { name: userName, city: { name: cityName } }, { mutate: false, prototypes: true });
    expect(stateChangeUser.user).not.to.be.instanceOf(User);
    expect(stateChangeUser.user.name).to.be.equal(userName);
    expect(stateChangeUser.user.name).not.to.be.equal(stateCopy.user.name);
    expect(stateChangeUser.user.city.name).to.be.equal(cityName);
    expect(stateChangeUser.user.city.name).not.to.be.equal(stateCopy.user.city.name);
    expect(stateChangeUser.user.city.country).to.be.equal(undefined);

    const stateChangeUserCityName = set(stateCopy, 'user.city.name', cityName, { mutate: false, prototypes: true });
    expect(stateChangeUserCityName.user.city).to.be.instanceOf(City);
    expect(stateChangeUserCityName.user.city.name).to.be.equal(cityName);
    expect(stateChangeUserCityName.user.city.name).not.to.be.equal(stateCopy.user.city.name);
  });

  it('set({ mutate: true, assign: false }): should set deeply nested value, with mutation of original object', () => {
    const stateCopy = cloneDeep(state, { prototypes: true });
    const userName = 'You';
    const cityName = 'NewCity';

    const stateChangeUserMutate = set(stateCopy, 'user', { name: userName, city: { name: cityName } }, { mutate: true, prototypes: true });
    expect(stateChangeUserMutate.user).not.to.be.instanceOf(User);
    expect(stateChangeUserMutate.user.name).to.be.equal(userName);
    expect(stateChangeUserMutate.user.name).to.be.equal(stateCopy.user.name);
    expect(stateChangeUserMutate.user.city.name).to.be.equal(cityName);
    expect(stateChangeUserMutate.user.city.name).to.be.equal(stateCopy.user.city.name);
  });

  it('set({ mutate: false, assign: true }): should set deeply nested value with assign, no mutation', () => {
    const stateCopy = cloneDeep(state, { prototypes: true });
    const userName = 'You';
    const cityName = 'NewCity';

    const options = { mutate: false, assign: true, prototypes: true };
    const stateChangeUser = set(stateCopy, 'user', { name: userName, city: { name: cityName } }, options);
    expect(stateChangeUser.user).to.be.instanceOf(User);
    expect(stateChangeUser.user.name).to.be.equal(userName);
    expect(stateChangeUser.user.name).not.to.be.equal(stateCopy.user.name);
    expect(stateChangeUser.user.city).to.be.instanceOf(City);
    expect(stateChangeUser.user.city.name).to.be.equal(cityName);
    expect(stateChangeUser.user.city.name).not.to.be.equal(stateCopy.user.city.name);
    expect(stateChangeUser.user.city.country).to.be.instanceOf(Country);
    expect(stateChangeUser.user.city.country.code).to.be.equal(stateCopy.user.city.country.code);
  });

  it('set({ mutate: true, assign: true }): should set deeply nested value with assign, no mutation', () => {
    const stateCopy = cloneDeep(state, { prototypes: true });
    const userName = 'You';
    const cityName = 'NewCity';

    const options = { mutate: true, assign: true, prototypes: true };
    const stateChangeUser = set(stateCopy, 'user', { name: userName, city: { name: cityName } }, options);
    expect(stateChangeUser.user).to.be.instanceOf(User);
    expect(stateChangeUser.user.name).to.be.equal(userName);
    expect(stateChangeUser.user.name).to.be.equal(stateCopy.user.name);
    expect(stateChangeUser.user.city).to.be.instanceOf(City);
    expect(stateChangeUser.user.city.name).to.be.equal(cityName);
    expect(stateChangeUser.user.city.name).to.be.equal(stateCopy.user.city.name);
    expect(stateChangeUser.user.city.country).to.be.instanceOf(Country);
    expect(stateChangeUser.user.city.country.code).to.be.equal(stateCopy.user.city.country.code);
  });

  it('isEqual(): should check values equality via JSON.stringify', () => {
    const a = { b: { c: { d: 1, e: [{ a: 1 }, { b: 2 }] } } };
    const b = cloneDeep(a);
    const c = cloneDeep({ ...a, s: 1 });

    expect(isEqual(a, b)).to.be.equal(true);
    expect(isEqual(a, c)).to.be.equal(false);
  });

  it('cloneDeep(): should deeply clone objects|arrays', () => {
    const ctry1 = new Country({ code: 'ctry1' });
    const ctry2 = new Country({ code: 'ctry2' });
    const ctry3 = new Country({ code: 'ctry3' });
    const cty1 = new City({ name: 'cty1', country: ctry1 });
    const usr1 = new User({ name: 'usr1', city: cty1 });

    const usr1Copy = cloneDeep(usr1, { prototypes: true });
    const ctrsList = [ctry2, ctry3];
    const ctrsListCopy = cloneDeep(ctrsList);

    ctry1.code = `${ctry1.code} updated`;
    ctry2.code = `${ctry2.code} updated`;
    ctry3.code = `${ctry3.code} updated`;
    cty1.name = `${cty1.name} updated`;
    usr1.name = `${usr1.name} updated`;

    expect(usr1Copy).to.be.instanceOf(User);
    expect(usr1Copy.city).to.be.instanceOf(City);
    expect(usr1Copy.city.country).to.be.instanceOf(Country);
    expect(usr1Copy.get()).to.be.equal(usr1Copy.name);
    expect(usr1Copy.name).not.to.be.equal(usr1.name);
    expect(usr1Copy.city.name).not.to.be.equal(cty1.name);
    expect(usr1Copy.city.country.code).not.to.be.equal(ctry1.code);

    ctrsListCopy.forEach((item, index) => {
      expect(item).not.to.be.instanceOf(Country);
      expect(item.code).not.to.be.equal(ctrsList[index].code);
    });
  });

  it('assignDeep(): should correctly assign deeply nested values', () => {
    const testCountry = new Country({ code: 'UA' });
    const testCity = new City({ name: 'Kiev', country: testCountry });

    const users = [
      new User({ name: 'F', city: testCity }),
      new User({ name: 'S', city: testCity }),
    ];

    const existingItemsChanges = [
      { name: 'F1' },
      { name: 'F2' },
    ];

    const nonExistingItemsChanges = [
      { name: 'F3' },
      { name: 'F4' },
    ];

    const result = assignDeep(users, [...existingItemsChanges, ...nonExistingItemsChanges]);

    [result[0], result[1]].forEach((item, index) => {
      expect(item).to.be.instanceOf(User);
      expect(item.city).to.be.instanceOf(City);
      expect(item.city.country).to.be.instanceOf(Country);
      expect(item.name).to.be.equal(existingItemsChanges[index].name);
    });

    [result[2], result[3]].forEach((item, index) => {
      expect(item).not.to.be.instanceOf(User);
      expect(item.city).to.be.equal(undefined);
      expect(item.city?.country).be.equal(undefined);
      expect(item.name).to.be.equal(nonExistingItemsChanges[index].name);
    });
  });
});
