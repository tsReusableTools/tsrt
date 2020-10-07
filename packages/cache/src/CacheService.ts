import { RedisClient, ClientOpts, createClient } from 'redis';
import { promisify } from 'util';

import { throwHttpError, msg } from '@tsd/utils';
import { log } from '@tsd/logger';

import { IAllCacheRecords } from './index';

export class BaseCacheService {
  private _db: RedisClient;

  constructor(clientOpts?: ClientOpts) {
    if (clientOpts) this.init(clientOpts);
  }

  public init(clientOpts: ClientOpts): void {
    if (this._db) return;

    this._db = createClient({
      ...clientOpts,
      /* eslint-disable-next-line */
      retry_strategy: (options) => {
        if (options?.error?.code === 'ECONNREFUSED') log.error(`REDIS CONNECTION REFUSED. URL: ${clientOpts.url}`);
        return Math.max(options.attempt * 100, 2000);
      },
    });

    process.on('SIGINT', () => this._db.quit());
    process.on('SIGTERM', () => this._db.quit());

    this._db.on('error', (err: Error) => { log.error(err); this._db.quit(); });
    this._db.on('reconnecting', () => log.debug('REDIS: RECONNECTING'));
  }

  public get db(): RedisClient {
    return this._db;
  }

  public async set<T>(key: string, data: T, expire?: number): Promise<void> {
    this.checkConnection();

    const setAsync = promisify(this._db.set).bind(this._db);
    const expAsync = promisify(this._db.expire).bind(this._db);

    try {
      await setAsync(key, JSON.stringify(data));

      if (!expire) {
        log.debug('BaseCacheService.set: setted data without expiration', data);
        return;
      }

      await expAsync(key, expire > 10 ? expire - 10 : expire);
      log.debug(`BaseCacheService.set: setted data which expires in ${expire}s`, data);
    } catch (err) {
      this.throwError(err);
    }
  }

  public async get(): Promise<IAllCacheRecords[]>;
  public async get<T>(key: string): Promise<T>;
  public async get<T>(key?: string): Promise<T | IAllCacheRecords[]> {
    return key ? this.getByKey(key) : this.getAllRecords();
  }

  public async getByKey<T>(key: string): Promise<T> {
    this.checkConnection();

    const getAsync = promisify(this._db.get).bind(this._db);

    return getAsync(key)
      .then((res: string) => (res ? JSON.parse(res) : throwHttpError.notFound()))
      .catch((err: Error) => this.throwError(err));
  }

  public async getAllRecords(): Promise<IAllCacheRecords[]> {
    this.checkConnection();

    try {
      const result: IAllCacheRecords[] = [];

      const keysAsync = promisify(this._db.keys).bind(this._db);
      const ttlAsync = promisify(this._db.ttl).bind(this._db);

      const keys: string[] = await keysAsync('*');
      if (!keys?.length) throwHttpError.notFound();

      await Promise.all(keys.map(async (key) => {
        const ttl = await ttlAsync(key);
        result.push({ key, ttl });
      }));

      return result;
    } catch (err) {
      this.throwError(err);
    }
  }

  public async del(key: string): Promise<void> {
    this.checkConnection();
    const delAsync = promisify(this._db.del).bind(this._db);
    await delAsync(key);
    log.debug(`BaseCacheService.del: deleted by key - ${key}`);
  }

  public async clear(): Promise<void> {
    this.checkConnection();
    const flushAsync = promisify(this._db.flushall).bind(this._db);
    await flushAsync('ASYNC');
    log.debug('BaseCacheService.clear: cleared all dbs');
  }

  /* eslint-disable-next-line */
  private throwError(err: any): void {
    if (msg.isValid(err)) throwHttpError(err);
    else throwHttpError.badRequest(err?.message);
  }

  private checkConnection(): void {
    if (!this._db) throw Error('There is no connection. Please, call `init` method first.');
    if (!this._db.connected) throwHttpError.internalServerError('Redis connection error.');
  }
}

export const CacheService = new BaseCacheService();
