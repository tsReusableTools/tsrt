import { isEmpty, getRandomString } from '@tsrt/utils';

export { getFileExtension } from '@tsrt/utils';

export function createFileName(originalFileName: string): string {
  const timestamp = Date.now();
  return `${timestamp}_${getRandomString()}_${originalFileName}`;
}

export function getFirstItem<T extends GenericObject>(object: T): T[keyof T] {
  if (!isEmpty(object)) return object[Object.keys(object)[0]];
}
