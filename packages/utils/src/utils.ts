/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPagedData, FlattenIfArray, KeyOf } from './types';
import { isEmpty } from './objectUtils';

/** Clone deep from `lodash.clonedeep`. */
export { default as cloneDeep } from 'lodash.clonedeep';

/** Checks whether environment is NodeJS */
export function isNodeJsEnvironment(): void {
  if (!process) throw Error('This method could be used only in NodeJS environment');
}

/** Checks whether environment is Browser */
export function isBrowserEnvironment(): void {
  if (!window) throw Error('This method could be used only in NodeJS environment');
}

/** Converts object into queryString */
export const formUrlEncoded = (query: GenericObject): string => Object
  .keys(query)
  .reduce((acc, c) => `${acc}&${c}=${encodeURIComponent(query[c])}`, '');

/** Adds zero before number. Example: 4 -> 04 | 10 -> 10 */
export const addZero = (data: number): string => (+data < 10 && +data >= 0 ? `0${data}` : `${data}`);

/** Capitalizes provided string */
export const capitalize = (str: string): string => str[0].toUpperCase() + str.slice(1);

/** Removes params from provided url */
export const removeParams = (url: string): string => url.replace(/\?.*/gi, '');

/**
 *  Parses data and corrects types: from string to boolean | number.
 *
 *  @param input - Data to parse.
 *  @param [deepness] - Recursion deepness fo data parsing.
 */
export const parseTypes = <T extends GenericAny>(input: T, deepness?: number): T => {
  function parser(data: T, deepLevel = 0): T {
    let result: T;

    if (deepness && !Number.isNaN(deepness) && deepLevel >= deepness) return data;

    // Parse null
    if (data === null || data === 'null') return null;

    // Parse string
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.toLowerCase() === 'true') return true as T;
      if (trimmed.toLowerCase() === 'false') return false as T;
      if (trimmed === '') return data as T;
      if (!Number.isNaN(+trimmed) && (trimmed[0] !== '0' || +trimmed === 0)) return +data as T;

      return data as T;
    }

    // Parse array
    if (Array.isArray(data) && data.length) {
      return data.map((item) => parser(item, deepLevel + 1)) as T;
    }

    // Parse Date
    if (data instanceof Date) return data;

    // Parse object
    if (typeof data === 'object' && !isEmpty(data as GenericObject)) {
      (result as GenericObject) = { };
      Object.keys(data).forEach((key) => {
        (result as GenericObject)[key] = parser((data as GenericObject)[key], deepLevel + 1);
      });
      return result;
    }

    return data;
  }

  return parser(input);
};

/**
 *  Creates a singleton for provided class.
 *
 *  @param constructor - Basic class for which to create a singleton
 *  @param [...args] - Arguments for Singleton constructor
 */
export const singleton = <S extends Constructor>(
  constructor: S, ...args: ConstructorParameters<S>
): InstanceType<S> => {
  class Singleton extends constructor {
    private static _instance: InstanceType<S>;

    public static get instance(): InstanceType<S> {
      if (!this._instance) this._instance = new Singleton(...args);
      return this._instance;
    }

    private constructor(...xargs: any[]) { super(...xargs); }
  }

  return Singleton.instance;
};

/**
 *  Recursively parses data and converts arrayLiked objects into array
 *
 *  Example: `{ '0': 'asd', '1': 'sdf', '2': 'aaa' } -> ['asd', 'sdf', 'aaa']`
 *
 *  @param data - Data to parse
 */
export const parseArrayLikeObjectIntoArray = (data: any): any => {
  if (typeof data !== 'object') return data;

  /* eslint-disable-next-line no-param-reassign */
  Object.keys(data).forEach((key) => { data[key] = parseArrayLikeObjectIntoArray(data[key]); });

  let allKeysAreIndexes = true;
  Object.keys(data).forEach((key, i) => { if (allKeysAreIndexes) allKeysAreIndexes = +key === +i; });

  /* eslint-disable-next-line no-param-reassign */
  if (allKeysAreIndexes) data = Object.keys(data).map((key) => data[key]);

  return data;
};

/**
 *  Merges provided list of arrays and gets only unique values.
 *
 *  Example:
 *  ```ts
 *  getUniqueValues([1, 2, 3], [2, 3, 4], [3, 4, 5], [5]) => [1, 2, 3, 4, 5]
 *  ```
 *
 *  @param lists - List of arrays to merge.
 */
export function getUniqueValues<I = any>(...lists: I[][]): I[] {
  const result: I[] = [];
  lists.forEach((item) => (Array.isArray(item) ? result.push(...item) : undefined));

  return result
    .reduce((acc, curr) => (acc.includes(curr) ? acc : [...acc, curr]), [])
    .sort((a, b) => a - b);
}

/**
 *  Creates structure for data (specifically for swagger - OpenAPI spec).
 *
 *  @param data - Original data object, for which there would be created a structure.
 */
export const createOpenApiDataStructure = <T extends GenericObject | string | number | boolean>(
  data: T,
): GenericObject => {
  const structure: GenericObject = { };

  if (data == null) {
    structure.type = 'string';
  } else if (typeof data === 'object' && data != null) {
    if (Array.isArray(data)) {
      structure.type = 'array';
      structure.items = createOpenApiDataStructure(data[0]);
    } else {
      structure.type = typeof data;
      structure.properties = { };

      Object.keys(data).forEach((key) => {
        structure.properties[key] = createOpenApiDataStructure((data as GenericObject)[key]);
      });
    }
  } else {
    structure.type = typeof data;
  }

  return structure;
};

/** Gets file extension from provided fileName */
export const getFileExtension = (filename: string): string => (filename ? filename.split('.').pop() : filename);

/** Creates RegExp for not containing provided string | strings  */
export function regExpExcludedStrings(str: string | string[]): RegExp {
  return typeof str === 'string'
    ? new RegExp(`^((?!${str}).)*$`)
    : new RegExp(`^((?!(${str.join('|')})).)*$`);
}

/**
 *  Waits for provided amount of milliseconds and optionaly returns data/invokes callback.
 *
 *  @param timeout - Timeout for delay.
 *  @param [cbOrData] - Optional data or callback, to be executed after delay.
 */
export async function delay(timeout: number): Promise<void>;
export async function delay<T>(timeout: number, cb?: () => Promise<T> | T): Promise<T>;
export async function delay<T>(timeout: number, data?: T): Promise<T>;
export async function delay<T>(timeout: number, cbOrData?: T | (() => Promise<T> | T)): Promise<T> {
  return new Promise((resolve, reject) => setTimeout(async () => {
    if (typeof cbOrData !== 'function') return resolve(cbOrData);
    try {
      const result = await (cbOrData as () => Promise<T>)();
      return resolve(result);
    } catch (err) { return reject(err); }
  }, timeout ?? 0));
}

/** Gets random string */
export const randomString = (): string => Math.random().toString(36).substring(2, 15);

/**
 *  Gets random number from provided diapason.
 *
 *  @param min - Minimal threshold.
 *  @param max - Maximum threshold.
 */
export const randomInt = (min = 0, max = 1): number => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 *  Gets random value from provided values.
 *
 *  @param args - List of values to get random from.
 */
export const random = (...args: any[]): any => args[randomInt(0, args.length - 1)];

/**
 *  Sort array by provided property. Ascending or descanding dirs are allowed.
 *
 *  @param array - Array to sort.
 *  @param prop - Prop to sort by.
 *  @param [dir='asc'] - Direction to sort.
 */
export function sortBy<T extends GenericObject, P extends keyof T>(arr: T[], prop: P, dir: 'asc' | 'desc' = 'asc'): T[] {
  const result = [...arr];

  if (!result || !result.length) return result;

  const propString = prop as string;
  const exampleProp = result[0][prop];
  let type = 'number';
  if (typeof exampleProp === 'number') type = 'number';
  if (typeof exampleProp === 'string') {
    type = 'string';

    if (typeof new Date(exampleProp) === 'object') type = 'Date';
  }

  result.sort((first, second) => {
    const a = dir === 'asc' ? first : second;
    const b = dir === 'asc' ? second : first;

    if (type === 'number') return a[propString] - b[propString];
    if (type === 'string') return a[propString].localeCompare(b[propString]);
    if (type === 'Date') return (new Date(a[propString]) as any) - (new Date(b[propString]) as any);
    return 1;
  });

  return result;
}

/**
 *  Removes item from array and returns new array.
 *
 *  @param array - Array to remove item from.
 *  @param propToFindAndRemoveBy - Property name to find necessary item by.
 *  @param valueToFindAndRemoveBy - Value to find necessary item by.
 */
export function removeItemFromArray<T extends GenericObject = GenericObject>(
  array: T[], propToFindAndRemoveBy: string, valueToFindAndRemoveBy: number | string | boolean,
): void {
  const toDelete = array.findIndex((item) => item[propToFindAndRemoveBy] === valueToFindAndRemoveBy);
  array.splice(toDelete, 1);
}

/**
 *  Excludes `keys` from provided target when they meets values.
 *
 *  @param target - Target to exclude values from.
 *  @param keys - List of keys to exclude.
 *  @param values - List of values to compare against for exclude.
 */
export function exlcude<T extends GenericObject, K extends KeyOf<FlattenIfArray<T>>>(
  target: T, keys: K[], values?: Array<T[K]>,
): Partial<T> {
  if (Array.isArray(target)) {
    if (values) return target.filter((item) => !keys.find((key) => values.includes(item[key]))) as unknown as T;
    return target.filter((item) => !keys.includes(item)) as unknown as T;
  }

  if (!Array.isArray(target)) {
    const result = { ...target };
    if (!values) keys.forEach((key) => delete result[key]);
    else keys.forEach((key) => { if (values.find((value) => value === result[key])) delete result[key]; });
    return result;
  }
}

/**
 *  Create paged response w/ data and [total, nextPage] metadata.
 *
 *  @param value - Array (page) w/ data to be returned.
 *  @param total - Total amount of records existed under similar conditions.
 *  @param query - Query w/ offset and limit properties to calculate next page offset.
 */
export function createPagedData<I>(value: I[], total: number, query: { offset?: number; limit?: number | string; }): IPagedData<I> {
  const nextSkip = (+query.offset ?? 0) + (+query.limit ?? 0);

  const result: IPagedData<I> = query.limit && total && nextSkip && total > nextSkip
    ? { nextSkip, total, value }
    : { total, value };

  if (!total) delete result.total;

  return result;
}

/**
 *  Parses provided html and leaves allowed (removes forbidden) html tags.
 *
 *  @param html - Valid html.
 *  @param tags - List of allowed (forbidden) tags.
 *  @param [removeProvidedTags=false] - Whether to remove provided tags or leave.
 */
export function htmlWithAllowedTags(html: string, tags: string[] = [], removeProvidedTags = false): string {
  if (removeProvidedTags) {
    let result = html;
    tags.forEach((item) => { result = result.replace(new RegExp(`</?${item}(.|\n)*?>`, 'gi'), ''); });
    return result;
  }

  const htmlTagsWithAttributes = html.match(/<\/?(.|\n)*?>/gi) || [];
  const htmlTagsWithoutAttributes = htmlTagsWithAttributes.map((item) => item.replace(/<\/?\s*(\w+)(.|\n)*?>/gi, '$1'));
  const htmlTags = getUniqueValues(htmlTagsWithoutAttributes).filter((item) => !tags.includes(item));
  return htmlWithAllowedTags(html, htmlTags, true);

  // Browser only alternative.
  // const tag = document.createElement('div');
  // tag.innerHTML = html;
  // const t = tag.getElementsByTagName('*');
  // const ele = [];
  // for (let i = 0; i < t.length; i++) ele.push(t[i].tagName);
}

/**
 *  Checks whether a provided url is valid.
 *
 *  @see https://stackoverflow.com/a/5717133/10521225.
 */
export function isValidUrl(url: string): boolean {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(url);
}

/**
 *  Create Array of numbers w/ specified [from, ..., to] range and step.
 *
 *  @param from - Range min value.
 *  @param to - Range max value.
 *  @param [step=1] - Range step.
 */
export function range(from: number, to: number, step = 1): number[] {
  return [...Array(Math.floor((to - from) / step) + 1)].map((_, i) => from + i * step);
}

/**
 *  Returns a number whose value is limited to the given range.
 *
 *  @param value - The value to be clamped.
 *  @param max - The upper boundary of the output range.
 *  @param [min=0] - The lower boundary of the output range.
 */
export function clamp(value: number, max: number, min = 0): number { return Math.min(Math.max(min, value), max); }

/**
 *  Shortcut for try { } catch (err) { } block w/ sync/async interface. Main reason - to use when need only try block.
 *  @param cb - Callback to be called in `try` block.
 *  @param errCb  - Callback to be called in `catch` block.
 *
 *  @note still under construction and thinking about  (thus, not ready for prod usage yet).
 */
export async function tryCatch(cb: () => Promise<any>, errCb?: (err: any) => Promise<any>): Promise<any>
export function tryCatch(cb: () => any, errCb?: (err: any) => any): any;
export async function tryCatch(cb: () => Promise<any> | any, errCb?: (err: any) => Promise<any> | any): Promise<any> {
  try {
    const result = await cb();
    return result;
  } catch (err) {
    if (errCb) return errCb(err);
  }
}

/**
 *  Inserts data into provided class/context/object.
 *
 *  @param cls - Class/object/context to which to insert data.
 *  @param data - Data to insert.
 */
export function insertIntoClass<C, T>(cls: C, data: T): void {
  if (!data || !cls) throw new Error('It is necessary to provide both: class/context and data to insert');
  Object.entries(data).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    /* eslint-disable-next-line no-param-reassign */
    (cls as GenericObject)[key] = value;
  });
}

/**
 *  Creates `Class` instance from provided object.
 *
 *  @param Cls - Class, which instance it will create and insert data into it.
 *  @param data - Data to insert.
 */
export function plainToClass<C extends Constructor, T>(Cls: C, data: T): C {
  const result = new Cls();
  insertIntoClass(result, data);
  return result;
}
