/* eslint-disable @typescript-eslint/no-explicit-any */

/** Gets list of provided object values. Example: { a: 1, b: 2 } -> [1, 2] */
export function getObjectValuesList<T extends GenericObject, K extends keyof T>(object: T): Array<T[K]> {
  return Object.keys(object).map((key) => object[key]);
}

export function isSymbol(target: any): boolean {
  return typeof target === 'symbol' || target instanceof Symbol || target === Symbol;
}

export function isString(target: any): boolean {
  return typeof target === 'string' || target instanceof String || target === String;
}

export function isNumber(target: any): boolean {
  return typeof target === 'number' || target instanceof Number || target === Number;
}

export function isBoolean(target: any): boolean {
  return typeof target === 'boolean' || target instanceof Boolean || target === Boolean;
}

export function isPrimitiveOrPrimitiveClass(target: any): boolean {
  return isString(target) || isNumber(target) || isBoolean(target);
}

export function isPrimitive(target: any): boolean {
  return isPrimitiveOrPrimitiveClass(target);
}

export function isArray(target: any): boolean {
  return target && Array.isArray(target);
}

export function isDate(target: any): boolean {
  return target && (target === Date || (target instanceof Date && !Number.isNaN(+target)));
}

export function isObject(target: any): boolean {
  return target && typeof target === 'object';
}

export function isFunction(target: any): boolean {
  return target && typeof target === 'function';
}

export function isArrowFn(target: any): boolean {
  return target && isFunction(target) && !target.prototype;
}

export function isNull(target: any): boolean {
  return target === null;
}

export function isNil(target: any): boolean {
  return target === undefined || target === null;
}

/**
 *  Checks whether provided value is:
 *  1. empty if object / array.
 *  2. empty if string.
 *  3. null or undefined.
 */
export function isEmpty(target: any): boolean {
  return (isObject(target) && !Object.keys(target).length) || (isString(target) && target === '') || isNil(target);
}

/** Checks that provide object is empty or have all props null or undefined */
export function isEmptyNil(target: GenericObject): boolean {
  return isObject(target) && getObjectValuesList(target).every((item) => isNil(item));
}

export function isPromise(target: any): boolean {
  return (target === Promise
    || target instanceof Promise
    || (!!target && typeof target.subscribe !== 'function' && typeof target.then === 'function'));
}

export function isStream(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && typeof obj.pipe === 'function';
}
