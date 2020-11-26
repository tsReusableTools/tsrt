import { getRandomString } from '@tsrt/utils';

export function createFileName(originalFileName: string): string {
  const timestamp = Date.now();
  return `${timestamp}_${getRandomString()}_${originalFileName}`;
}
