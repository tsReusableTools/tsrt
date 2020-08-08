/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LeveledLogMethod, LogCallback, Logger } from 'winston';
import '@tsd/types';

/** Type for msg aliases */
export type msgAlias = <T = any>(data?: T, code?: number | string) => IHttpError<T>

/** Interface for parsed substring for insert function */
export interface ISubstring {
  start?: number;
  length?: number;
  end?: number;
}

/** Interface for item, which could be reordered */
export interface IOrderedItem extends GenericObject {
  id: number;
  order: number;
}

/** Interface for custom winston logger log method */
export interface ICustomLogger extends LeveledLogMethod {
  (message: string, callback: LogCallback): Logger;
  (message: string, meta: unknown, callback: LogCallback): Logger;
  (message: unknown, ...meta: unknown[]): Logger;
  (infoObject: object): Logger;
}

/** Interface for custom winston logger */
export interface ILogger {
  info: ICustomLogger;
  error: ICustomLogger;
  warn: ICustomLogger;
  debug: ICustomLogger;
  verbose: ICustomLogger;
}

/* eslint-disable-next-line */
declare global { namespace Express { interface Request { id: string; } } }
