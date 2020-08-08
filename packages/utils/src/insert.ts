import { readFileSync, writeSync, closeSync, openSync, writeFileSync, existsSync } from 'fs';

import { ISubstring } from './types';
import { isNodeJsEnvironment } from './utils';

/**
 *  Gets file substring.
 *
 *  @param path - Dir / file path.
 *  @param substr - Substring to get.
 *  @param [file] - File, in order not to read manually.
 */
export function getsdbstring(path: string, substr: string | RegExp, providedFile?: string | Buffer): ISubstring {
  isNodeJsEnvironment();
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
  isNodeJsEnvironment();
  const file = readFileSync(path, 'utf8');
  if (!file) return;

  // Get position to insert (to the end of file by default)
  let index = file.length;

  if (mode === 'a' || mode === 'b') {
    const { start, end } = getsdbstring(path, substr, file) || { };

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
