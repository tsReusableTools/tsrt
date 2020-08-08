import { isEmpty } from './objectUtils';

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
export const getEnvProp = <T extends string | number | boolean = string>(prop: string, defaultValue?: T): T => {
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
      if (!this._instance) this._instance = new Singleton(...args);
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
 *  Example: `{ '0': 'asd', '1': 'sdf', '2': 'aaa' } -> ['asd', 'sdf', 'aaa']`
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
 *  Example:
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
 *  Creates structure for data (specifically for swagger - OpenAPI spec).
 *
 *  @param data - Original data object, for which there would be created a structure.
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

/** Gets file extension from provided fileName */
export const getFileExtension = (filename: string): string => (filename ? filename.split('.').pop() : filename);

/** Creates RegExp for not containing provided string | strings  */
export function getNotContainingStringsRegExp(str: string | string[]): RegExp {
  return typeof str === 'string'
    ? new RegExp(`^((?!${str}).)*$`)
    : new RegExp(`^((?!(${str.join('|')})).)*$`);
}
