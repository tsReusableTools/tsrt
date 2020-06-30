/* eslint-disable import/no-extraneous-dependencies */
import { promisify } from 'util';
import * as redis from 'redis';

import { msg, log } from '@ts-utils/utils';

import { IBaseCacheService, ICacheRecordsList } from '../types';

/** This Service provides common methods for working w/ Redis */
export abstract class BaseCacheService implements IBaseCacheService {
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

  /** Gets RedisDB connection */
  public get db(): redis.RedisClient {
    return this._db;
  }

  /**
   *  Sets cache, Optionally with expiration
   *
   *  @param key - Key to set by
   *  @param data - Data to store
   *  @param [time] - Expiration time
   *  Time - 10 (seconds) -> to prevent errors when smth found in cache
   */
  public async set<T>(
    key: string, data: T, expire?: number,
  ): IMsgPromise<T> {
    const connected = this.checkConnection();
    if (connected.status >= 400) return connected;

    // Make Redis.set() & expire() an async functions
    const setAsync = promisify(this._db.set).bind(this._db);
    const expAsync = promisify(this._db.expire).bind(this._db);

    // Set data to _db
    const result: IMsg<T> = await setAsync(key, JSON.stringify(data))
      .then((res: string) => (res ? msg.ok(res) : msg.internalServerError()))
      .catch((err: Error) => {
        log.error(err, ['ERROR IN CACHE_SERVICE: SET DATA']);
        return msg.internalServerError(err);
      });

    if (result.status >= 400) return result;

    // Log if no expiration provided
    if (!expire) {
      log.info(data, ['IN CACHE_SERVICE: SET DATA', 'magenta']);
      return result;
    }

    // Set expiration
    await expAsync(key, expire > 10 ? expire - 10 : expire)
      .then(() => log.info(
        data,
        [`IN CACHE_SERVICE: SET DATA WITH EXPIRATION - ${expire}s`, 'magenta'],
      ))
      .catch((err: Error) => log.error(err.message, ['ERROR IN CACHE_SERVICE: SET EXPIRATION']));

    return result;
  }

  /**
   *  Gets data from cache by key
   *
   *  @param key - Key to get by
   */
  public async get<T>(key: string): IMsgPromise<T> {
    const connected = this.checkConnection();
    if (connected.status >= 400) return connected;

    const getAsync = promisify(this._db.get).bind(this._db);

    return getAsync(key)
      .then((res: string) => {
        try {
          return res
            ? msg.ok(JSON.parse(res))
            : msg.notFound();
        } catch (err) {
          log.error(err, ['ERROR IN CACHE_SERVICE. PARSE DATA']);
          return msg.internalServerError(err);
        }
      })
      .catch((err: Error) => {
        log.error(err, ['ERROR IN CACHE_SERVICE: GET DATA']);
        return msg.internalServerError(err);
      });
  }

  /**
   *  Removes data from cache by key
   *
   *  @param key - Key to delete by
   */
  public async del(key: string): IMsgPromise {
    const connected = this.checkConnection();
    if (connected.status >= 400) return connected;

    const delAsync = promisify(this._db.del).bind(this._db);

    const result: IMsg = await delAsync(key)
      .then((res: number) => (res ? msg.ok(res) : msg.notFound()))
      .catch((err: Error) => {
        log.error(err, ['ERROR IN CACHE_SERVICE: DELETE DATA']);
        return msg.internalServerError(err);
      });

    if (result.status < 400) {
      log.info(
        `Deleted data by [KEY] - ${key}`,
        ['IN CACHE_SERVICE: DELETE DATA', 'magenta'],
      );
    }

    return result;
  }

  /**
   *  Gets all cache keys. Optionally with ttl (time to expiration)
   *
   *  @param [ttlFlag=true] - Whether to include ttl (time to expiration)
   */
  public async getAll(ttlFlag = true): IMsgPromise<ICacheRecordsList[]> {
    const connected = this.checkConnection();
    if (connected.status >= 400) return connected;

    const result: ICacheRecordsList[] = [];

    const keysAsync = promisify(this._db.keys).bind(this._db);
    const ttlAsync = promisify(this._db.ttl).bind(this._db);

    // Get keys
    const keys: IMsg<string[]> = await keysAsync('*')
      .then((res: string[]) => (res && res.length ? msg.ok(res) : msg.notFound()))
      .catch((err: Error) => {
        log.error(err, ['ERROR IN CACHE_SERVICE: GET ALL']);
        return msg.internalServerError(err);
      });

    if (keys.status >= 400) return keys as IMsg;

    // Get ttl
    await Promise.all(keys.data.map(async (key) => {
      if (ttlFlag) {
        await ttlAsync(key)
          .then((ttl: number) => result.push({ key, ttl }))
          .catch((err: Error) => log.error(err, ['ERROR IN CACHE_SERVICE: GET TTL']));
      } else {
        result.push({ key });
      }
    }));

    return msg.ok(result);
  }

  /** Clears all _dbs */
  public async clearAll(): Promise<IMsg> {
    const connected = this.checkConnection();
    if (connected.status >= 400) return connected;

    const flushAsync = promisify(this._db.flushall).bind(this._db);

    const result: IMsg = await flushAsync('ASYNC')
      .then((res: boolean) => (res ? msg.ok(res) : msg.notFound()))
      .catch((err: Error) => {
        log.error(err, ['ERROR IN CACHE_SERVICE: CLEAR ALL _dbS']);
        return msg.internalServerError(err);
      });

    if (result.status < 400) log.info(result, ['IN CACHE_SERVICE: CLEAR ALL _dbS', 'magenta']);

    return result;
  }

  /** Checks connection */
  private checkConnection(): IMsg {
    if (!this._db) {
      throw Error('Please, call init() method first for DB creating connection');
    }

    if (!this._db.connected) {
      return msg.internalServerError('REDIS CONNECTION ERROR') as IMsg;
    }

    return msg.ok();
  }
}
