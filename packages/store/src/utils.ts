import { Get, PartialDeep } from 'type-fest';

import { GenericObject, NestedKeys } from './types';

export function isNil<T>(target: T): boolean {
  return target === null || target === undefined;
}

/**
 * Lodash.assing but also for deeply nested properties
 *
 * @Note mutates `target` object.
 *
 * @param - target object, to assign values to.
 * @param - object, to assign values from.
 *
 * @returns mutated `target` object.
 */
export function assignDeep<T extends GenericObject, R extends GenericObject>(target: T, source: R): T {
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(target, key)) {
      assignDeep(target[key], value);
      Object.assign(target[key], value);
      /* eslint-disable-next-line no-param-reassign */
    } else (target as GenericObject)[key] = value;
  });

  return target;
}

export function toPath(input: string, { brackets = false }: { brackets?: boolean } = { }): string[] {
  let result = input;
  if (brackets) result = input.replace(/\[(.*?)\]/gi, '.$1');
  return result.split('.').filter(Boolean);
}

/**
 * Prmitive cloneDeep: deeply clones arrays, objects (not Map, Set, etc) with prototype inheritence
 *
 * @param input - value to copy.
 * @param [options.prototypes] - Whether to set prototypes same as from copied object. This decreases performance. @default false.
 */
export function cloneDeep<T>(input: T, options: { prototypes?: boolean } = { }): T {
  if (input && typeof input === 'object') {
    const result = Array.isArray(input) ? [] : { };
    // It is much faster not to set ptototypes
    if (options.prototypes) Object.setPrototypeOf(result, Object.getPrototypeOf(input));

    // For ... in is much faster than Object.entries | Object.keys (Tested on jsbench.me & measurethat.net/Benchmarks)
    /* eslint-disable-next-line */
    for (const key in input) {
      const value = input[key];
      (result as GenericObject)[key] = cloneDeep(value, options);
    }

    // Object.entries(input).forEach(([key, value]) => { (result as GenericObject)[key] = cloneDeep(value); });

    return result as T;
  }

  return input;
}

/** Checks arguments to be equal via JSON.stringify output */
export function isEqual<V, O>(value: V, other: O): boolean {
  return JSON.stringify(value) === JSON.stringify(other);
}

function getValue<T>(value: T, options: { prototypes?: boolean } = { }): T {
  if (!value) return value;
  if (Array.isArray(value)) return [...value] as unknown as T;
  if (typeof value === 'object') {
    const result = { ...value };
    if (options.prototypes) Object.setPrototypeOf(result, Object.getPrototypeOf(value));
    return result;
  }
  return value;
}

function createValue(path: string): GenericObject {
  return Number.isNaN(+path) ? { } : Array.from({ length: +path });
}

/**
 * Sets deeply nested property by path. If some path's part is not exists it will be created.
 *
 * @param target - Target object to set property into.
 * @param propertyPath - Property path using dot notation.
 * @param value - Value to set.
 * @param [options.mutate] - Whether to mutate `target` object. If false - will not mutate target object. @default true
 * @param [options.assign] - Whether to assign instead of set. @default false
 *
 * @returns `target`.
 *
 * @example
 * const target = { user: { id: 1 }, todos: [{ id: 1 }] };
 * set(target, 'user.id', 2); // Will set user.id property
 * set(target, 'user.todos.1.id', 2); // Will create second todo in list and set its `id` to 2
 */
export function set<T extends GenericObject, K extends NestedKeys<T> = NestedKeys<T>, V extends Get<T, K> = Get<T, K>>(
  target: T,
  propertyPath: K,
  value: PartialDeep<V>,
  options: { mutate?: boolean, assign?: boolean, prototypes?: boolean } = { },
): T {
  if (!propertyPath?.length) return target;
  const { mutate = true, assign = false } = options;

  const result: GenericObject = mutate ? target : getValue(target, options);
  const paths = toPath(propertyPath);

  const currentPath = paths.splice(0, 1)[0];
  if (!result[currentPath]) result[currentPath] = createValue(paths[0] ?? currentPath);

  if (!paths.length) {
    const canAssign = assign && typeof value === 'object' && typeof result[currentPath] === 'object';
    const shouldCloneDeep = canAssign && !mutate && !!Object.values(value).find((item) => typeof item === 'object');
    const targetForAssign = shouldCloneDeep ? cloneDeep(result[currentPath], options) : getValue(result[currentPath], options);
    result[currentPath] = canAssign ? assignDeep(targetForAssign, getValue(value, options)) : getValue(value, options);
  } else result[currentPath] = set(result[currentPath], paths.join('.'), value, options);

  return result as T;
}

/**
 * Gets property by provided dot notated propertyPath.
 *
 * @param target - Object to get property from.
 * @param propertyPath - PropertyPath, dot notated.
 * @param [defaultValue] - DefaultValue to be used if not value found at provided `propertyPath`.
 *
 * @returns value at `propertyPath` or `defaultValue`.
 *
 * @example
 * get({ user: { city: { title: 'Title' } } }, 'user.city.title', 'Not Found');
 */
export function get<T extends GenericObject, K extends NestedKeys<T> = NestedKeys<T>, V extends Get<T, K> = Get<T, K>>(
  target: T,
  propertyPath: K,
  defaultValue?: V,
): T {
  const paths = toPath(propertyPath);
  const currentPath = paths.splice(0, 1)[0];
  const result = paths.length && target[currentPath] ? get(target[currentPath], paths.join('.'), defaultValue) : target[currentPath];
  return result ?? defaultValue;
}
