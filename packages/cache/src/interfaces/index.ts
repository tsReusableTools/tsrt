import { ClientOpts } from 'redis';

export interface IAllCacheRecords {
  key: string | number;
  ttl?: number;
}

export type ICacheSettings = ClientOpts;

export interface ICacheServiceSettings {
  log?: ILogger;
}

export interface ILogger {
  debug(data: any, ...args: any[]): any;
  info(data: any, ...args: any[]): any;
  warn?(data: any, ...args: any[]): any;
  error(data: any, ...args: any[]): any;
}
