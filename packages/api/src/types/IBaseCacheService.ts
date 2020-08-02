/* eslint-disable @typescript-eslint/no-explicit-any */
/** Interface all Cache records */
export interface ICacheRecordsList {
  key: string | number;
  ttl?: number;
}

/** Inteface for Cache server (db) config */
export interface IBaseCacheServiceonfig {
  EXPIRATION: number;
  PWD: string;
  URL: string;
}

/** Interface for CacheController */
export interface IBaseCacheService {
  /**
   *  Initiates DB connection. It is necessary to call it before usage.
   *
   *  @param [customUrl] - Optional Redis server url.
   *  @param [customUrl] - Optional Redis server pwd.
   */
  init(customUrl?: string, customPwd?: string): void;

  /**
   *  Sets cache, Optionally with expiration
   *
   *  @param key - Key to set by
   *  @param data - Data to store
   *  @param [time] - Expiration time
   */
  set<T = any>(key: string, data: any, time?: number): Promise<T>;

  /**
   *  Gets data from cache by key
   *
   *  @param key - Key to get by
   */
  get<T = any>(key: string): Promise<T>;

  /**
   *  Removes data from cache by key
   *
   *  @param key - Key to delete by
   */
  del(key: string): Promise<any>;

  /**
   *  Gets all cache keys. Optionally with ttl (time to expiration)
   *
   *  @param [ttl=true] - Whether to include ttl (time to expiration)
   */
  getAll(ttl?: boolean): Promise<ICacheRecordsList[]>;

  /** Clears all dbs */
  clearAll(): Promise<any>;
}
