export function getInt(target: string | number): number {
  return typeof target === 'string' ? Number.parseFloat(target) : target;
}

export function getBoolean(target: string | boolean): boolean {
  return target === 'true' || target === '' || target === true;
}

export function getBooleanOrInt(target: string | boolean | number): boolean | number {
  const num = getInt(target as number);
  return Number.isInteger(num) ? num : getBoolean(target as boolean);
}

/* eslint-disable-next-line */
export function isEmpty(obj: any): boolean { return !Object.keys(obj).length; }
