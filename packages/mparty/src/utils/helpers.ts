import { randomString } from '@tsrt/utils';

export function createFileName(originalFileName: string): string {
  const timestamp = Date.now();
  return `${timestamp}_${randomString()}_${originalFileName}`;
}
