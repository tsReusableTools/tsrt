import { ClientOpts } from 'redis';

export interface IAllCacheRecords {
  key: string | number;
  ttl?: number;
}

export type ICacheSettings = ClientOpts;
