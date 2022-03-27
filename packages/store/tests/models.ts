/* eslint-disable max-classes-per-file */
export function insertIntoClass<C, T>(context: C, data: T): void {
  if (!data || !context) throw new Error('It is necessary to provide both: data and context');
  Object.entries(data).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    (context as Record<string, unknown>)[key] = value;
  });
}

export class Base<T> {
  constructor(input: T) {
    insertIntoClass(this, input);
  }
}

export class Country extends Base<ICountry> implements ICountry {
  public code: string;
}

export class City extends Base<ICity> implements ICity {
  public name: string;
  public country: ICountry;
}

export class User extends Base<IUser> implements IUser {
  public name: string;
  public city: ICity;

  public get(): string { return this.name; }
}

export class Todo extends Base<ITodo> implements ITodo {
  public id: number;
  public title: string;

  public getTitle(): string { return this.title; }
}

export interface IUser {
  name: string;
  city: ICity;
}

export interface ICity {
  name: string;
  country: ICountry;
}

export interface ICountry {
  code: string;
}

export interface ITodo {
  id: number;
  title: string;
}

export class State extends Base<IState> implements IState {
  // public user?: User = undefined;
  // public todos?: Todo[] = undefined;
  // public version?: number = undefined;
  public user?: User;
  public todos?: Todo[];
  public version?: number;
}

export interface IState {
  user?: IUser;
  todos?: ITodo[];
  version?: number;
}

export const todos: Todo[] = [
  new Todo({ id: 1, title: 'F' }),
  new Todo({ id: 2, title: 'S' }),
];

export const country = new Country({ code: 'UA' });

export const city = new City({ name: 'Kiev', country });
export const user = new User({ name: 'Me', city });
export const version = 1;

export const state = new State({ user, todos, version });
