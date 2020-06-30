import { readFileSync, writeSync, closeSync, openSync, writeFileSync, existsSync } from 'fs';

import { ISubstring } from './types';

/** Converts object into queryString */
export const formUrlEncoded = (query: GenericObject): string => Object
  .keys(query)
  .reduce((acc, c) => `${acc}&${c}=${encodeURIComponent(query[c])}`, '');

/** Adds zero before number. Example: 4 -> 04 | 10 -> 10 */
export const addZero = (data: number): string => (+data < 10 && +data >= 0 ? `0${data}` : `${data}`);

/** Capitalizes provided string */
export const capitalize = (str: string): string => str[0].toUpperCase() + str.slice(1);

/** Checks if provided object isEmpty */
export const isEmpty = (obj: GenericObject): boolean => obj && !Object.keys(obj).length;

/** Removes params from provided url */
export const removeParams = (url: string): string => url.replace(/\?.*/gi, '');

/** Gets list of provided object values. Example: { a: 1, b: 2 } -> [1, 2] */
export function getObjectValuesList<T extends GenericObject, K extends keyof T>(object: T): Array<T[K]> {
  return Object.keys(object).map((key) => object[key]);
}

/**
 *  Parses data and corrects types: from string to boolean | number.
 *
 *  @param data - Data to parse.
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
      if (!Number.isNaN(+trimmed) && trimmed[0] !== '0') return +data as T;

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
 *  Get prop from .env, throwing error if prop does not found.
 *
 *  @param prop - Property name to get from .env.
 *  @param [defaultValue] - Default value for prop. If it is provided - no error will be thrown.
 */
export const getEnvProp = <T extends string | number | boolean = string>(
  prop: string, defaultValue?: T,
): T => {
  if (process.env[prop]) return parseTypes(process.env[prop]) as T;

  if (
    !process.env[prop]
    && (defaultValue || defaultValue === '' || defaultValue === 0 || defaultValue === false)
  ) return parseTypes(defaultValue);

  if (!process.env[prop] && !defaultValue && process.env.NODE_ENV !== 'testing') {
    throw new Error(`There is no prop: '${prop}' found in provided .env file`);
  }
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
      if (!this._instance) {
        this._instance = new Singleton(...args);
      }

      return this._instance;
    }

    /* eslint-disable-next-line */
    private constructor(...xargs: any[]) { super(...xargs); }
  }

  return Singleton.instance;
};

/**
 *  Recursively parses data and converts arrayLiked objects into array
 *
 *  Example:
 *  { '0': 'asd', '1': 'sdf', '2': 'aaa' } -> ['asd', 'sdf', 'aaa']
 *
 *  @param data - Data to parse
 */
/* eslint-disable-next-line */
export const parseArrayLikeObjectIntoArray = (data: any): any => {
  if (typeof data !== 'object') return data;

  /* eslint-disable-next-line */
  Object.keys(data).forEach((key) => { data[key] = parseArrayLikeObjectIntoArray(data[key]); });

  let allKeysAreIndexes = true;
  Object.keys(data).forEach((key, i) => {
    if (!allKeysAreIndexes) return;
    allKeysAreIndexes = +key === +i;
  });

  /* eslint-disable-next-line */
  if (allKeysAreIndexes) data = Object.keys(data).map((key) => data[key]);

  return data;
};

/**
 *  Merges provided list of arrays and gets only unique values.
 *
 *  Example
 *  ```ts
 *  getUniqueValues([1, 2, 3], [2, 3, 4], [3, 4, 5], [5]) => [1, 2, 3, 4, 5]
 *  ```
 *
 *  @param lists - List of arrays to merge.
 */
/* eslint-disable-next-line */
export function getUniqueValues<I = any>(...lists: I[][]): I[] {
  const result: I[] = [];
  lists.forEach((item) => (Array.isArray(item) ? result.push(...item) : undefined));

  return result
    .reduce((acc, curr) => (acc.includes(curr) ? acc : [...acc, curr]), [])
    .sort((a, b) => a - b);
}

/**
 *  Gets file substring.
 *
 *  @param path - Dir / file path.
 *  @param substr - Substring to get.
 *  @param [file] - File, in order not to read manually.
 */
export function getSubstring(path: string, substr: string | RegExp, providedFile?: string | Buffer): ISubstring {
  if (!existsSync(path)) return;

  const file = providedFile as string || readFileSync(path, 'utf8');

  let start: number;
  let length: number;
  let end: number;

  const match = file.match(substr);
  const indexOf = file.indexOf(substr as string);

  // If as RegExp found. Else -> if string found.
  if (match && match[0] && match.index !== -1) {
    start = match.index;
    length = match[0].length;
    end = start + length;
  } else if (indexOf !== -1 && typeof substr === 'string') {
    start = indexOf;
    length = substr.length;
    end = start + length;
  }

  return start !== undefined && length !== undefined && end !== undefined
    ? { start, length, end }
    : undefined;
}

/**
 *  Inserts (replaces) data into file.
 *
 *  @param path - File path.
 *  @param data - Data to insert.
 *  @param [substr] - String | RegExp, by which to get substring to define insert position.
 *  @param [mode='a'] - Defines mode: after substr, before or replace.
 *  @param [returnFile=false] - Whether to return updated file.
 */
export function insert(
  path: string, data: string, substr?: string | RegExp, mode: 'a' | 'b' | 'r' = 'a', returnFile = false,
): string {
  const file = readFileSync(path, 'utf8');
  if (!file) return;

  // Get position to insert (to the end of file by default)
  let index = file.length;

  if (mode === 'a' || mode === 'b') {
    const { start, end } = getSubstring(path, substr, file) || { };

    if (mode === 'a' && end) index = end;
    else if (mode === 'b' && start) index = start;

    // Get file text, which would be overwriten by new
    const substring = file.substring(index);

    const text = Buffer.from(data + substring);

    const fd = openSync(path, 'r+');
    writeSync(fd, text, 0, text.length, index);
    closeSync(fd);
  } else if (mode === 'r') {
    const replaced = file.replace(substr, data);
    writeFileSync(path, replaced, 'utf-8');
  } else return;

  if (returnFile) return readFileSync(path, 'utf8');
}

/**
 *  Creates structure for data (specifically for swagger)
 *
 *  @param data - Original data object, for which there would
 *  be created a structure
 */
export const createDataStructure = <T extends GenericObject | string | number | boolean>(
  data: T,
): GenericObject => {
  const structure: GenericObject = { };

  if (data == null) {
    structure.type = 'string';
  } else if (typeof data === 'object' && data != null) {
    if (Array.isArray(data)) {
      structure.type = 'array';
      structure.items = createDataStructure(data[0]);
    } else {
      structure.type = typeof data;
      structure.properties = { };

      Object.keys(data).forEach((key) => {
        structure.properties[key] = createDataStructure((data as GenericObject)[key]);
      });
    }
  } else {
    structure.type = typeof data;
  }

  return structure;
};

/**
 *  Gets file Extension from file name
 *
 *  @param filename - full file name
 */
export const getFileExtension = (filename: string): string => (filename ? filename.split('.').pop() : filename);
