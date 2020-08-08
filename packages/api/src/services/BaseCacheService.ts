/* eslint-disable import/no-extraneous-dependencies */
import { promisify } from 'util';
import * as redis from 'redis';

import { throwHttpError, log } from '@tsd/utils';

import { IBaseCacheService, ICacheRecordsList } from '../types';

/** This Service provides common methods for working w/ Redis */
export class BaseCacheService implements IBaseCacheService {
  private _db: redis.RedisClient;

  public constructor(
    private _url?: string,
    private _password?: string,
  ) { }

  /**
   *  Initiates DB connection. It is necessary to call it before usage.
   *
   *  @param [customUrl] - Optional Redis server url.
   *  @param [customUrl] - Optional Redis server pwd.
   */
  public init(customUrl?: string, customPwd?: string): void {
    const url = customUrl || this._url;
    const password = customPwd || this._password;

    if (!url || !password) {
      throw Error('Please, provice correct url and password for DB connection');
    }

    // Create connection
    this._db = redis.createClient(url, {
      password,
      /* eslint-disable-next-line */
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          log.error(`URL: ${url}`, ['REDIS CONNECTION REFUSED']);
        }

        // if (options.total_retry_time > 1000 * 60 * 60)
        //   return new Error('Retry time exhausted');

        // End reconnecting with built in error
        // if (options.attempt > 10)
        //   return undefined;

        return Math.max(options.attempt * 100, 2000);
      },
    });

    process.on('SIGINT', () => this._db.quit());

    process.on('SIGTERM', () => this._db.quit());

    this._db.on('error', (err: Error) => {
      log.error(err, ['ERROR IN CACHE_SERVICE: REDIS ERROR']);
      this._db.quit();
    });

    this._db.on('reconnecting', () => log.debug('', ['REDIS: RECONNECTING', 'magenta']));

    // // On connection open
    // this._db.on('ready', (err: any) =>
    //   log.debug('', ['REDIS: READY', 'magenta']));
    //
    // // On connection is idle
    // this._db.on('idle', (err: any) => {
    //   log.warn('', ['REDIS: IDLE. SHUTTIN DOWN ...', 'magenta']);
    //   this._db.quit();
    // });
    //
    // // On connection end
    // this._db.on('end', (err: any) =>
    //   log.warn('', ['REDIS: CLOSED', 'magenta']));
  }

  /** Cache provider (redis) connection */
  public get db(): redis.RedisClient {
    return this._db;
  }

  /**
   *  Sets cache, Optionally with expiration.
   *
   *  @param key - Key to set by.
   *  @param data - Data to store.
   *  @param [time] - Expiration time. Time - 10 (seconds) -> to prevent errors when smth found in cache.
   */
  public async set<T>(key: string, data: T, expire?: number): Promise<T> {
    this.checkConnection();

    try {
      const setAsync = promisify(this._db.set).bind(this._db);
      const expAsync = promisify(this._db.expire).bind(this._db);

      const result: T = await setAsync(key, JSON.stringify(data));
      if (!result) throwHttpError.internalServerError();

      if (!expire) {
        log.info(data, ['BaseCacheService: SET DATA', 'magenta']);
        return result;
      }

      await expAsync(key, expire > 10 ? expire - 10 : expire);
      log.info(data, [`BaseCacheService: SET DATA WITH EXPIRATION - ${expire}s`, 'magenta']);

      return result;
    } catch (err) {
      throwHttpError(err.status, err.data || err.message, 'BaseCacheService: set');
    }
  }

  public async get<T>(key: string): Promise<T> {
    this.checkConnection();

    try {
      const getAsync = promisify(this._db.get).bind(this._db);

      const result = await getAsync(key);
      if (!result) throwHttpError.notFound();

      return JSON.parse(result);
    } catch (err) {
      throwHttpError(err.status, err.data || err.message, 'BaseCacheService: get');
    }
  }

  /* eslint-disable-next-line */
  public async del(key: string): Promise<any> {
    this.checkConnection();

    try {
      const delAsync = promisify(this._db.del).bind(this._db);

      const result = await delAsync(key);
      if (!result) throwHttpError.notFound();

      log.info(`Deleted data by [KEY] - ${key}`, ['BaseCacheService: DELETE DATA', 'magenta']);
      return result;
    } catch (err) {
      throwHttpError(err.status, err.data || err.message, 'BaseCacheService: del');
    }
  }

  /**
   *  Gets all cache keys. Optionally with ttl (time to expiration).
   *
   *  @param [ttlFlag=true] - Whether to include ttl (time to expiration).
   */
  public async getAll(ttlFlag = true): Promise<ICacheRecordsList[]> {
    this.checkConnection();

    try {
      const result: ICacheRecordsList[] = [];

      const keysAsync = promisify(this._db.keys).bind(this._db);
      const ttlAsync = promisify(this._db.ttl).bind(this._db);

      const keys: string[] = await keysAsync('*');
      if (!keys || !keys.length) throwHttpError.notFound();

      await Promise.all(keys.map(async (key) => {
        if (ttlFlag) {
          await ttlAsync(key)
            .then((ttl: number) => result.push({ key, ttl }))
            .catch((err: Error) => log.error(err, ['BaseCacheService: GET TTL']));
        } else {
          result.push({ key });
        }
      }));

      return result;
    } catch (err) {
      throwHttpError(err.status, err.data || err.message, 'BaseCacheService: getAll');
    }
  }

  /* eslint-disable-next-line */
  public async clearAll(): Promise<any> {
    this.checkConnection();

    try {
      const flushAsync = promisify(this._db.flushall).bind(this._db);
      const result = await flushAsync('ASYNC');
      if (!result) throwHttpError.notFound();

      log.info(result, ['BaseCacheService: CLEAR ALL _dbS', 'magenta']);
      return result;
    } catch (err) {
      throwHttpError(err.status, err.data || err.message, 'BaseCacheService: clearAll');
    }
  }

  private checkConnection(): void {
    if (!this._db) throw Error('Please, call init() method first for DB creating connection');
    if (!this._db.connected) throwHttpError.internalServerError('', 'Redis connection error');
  }
}
