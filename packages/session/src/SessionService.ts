import { promisify } from 'util';
import { RequestHandler } from 'express';
import expressSession from 'express-session';
import connectRedis, { RedisStore } from 'connect-redis';

import { BaseCacheService, ICacheSettings } from '@tsrt/cache';

import { ISessionSettings, ISessionOptions } from './interfaces';

export class SessionService {
  private _sessionStore: RedisStore;
  private _settings: ISessionOptions = {
    resave: false,
    saveUninitialized: false,
    expiration: 86400 * 1000,
    cookie: {
      path: '/',
      secure: false,
      httpOnly: true,
      maxAge: 86400 * 1000,
    },
  } as ISessionOptions;

  public createMiddleware(settings: ISessionSettings): RequestHandler {
    if (!settings || !settings?.session?.name || !settings?.session?.secret) {
      throw Error('Please, provide session `name` and `secret` options ');
    }
    this._settings = this.mergeSettings(settings);
    return expressSession(this._settings);
  }

  public get store(): RedisStore {
    return this._sessionStore;
  }

  public get settings(): ISessionOptions {
    return this._settings;
  }

  public async destroy(session: Express.Session): Promise<void> {
    if (!session) return;

    const asyncDestroy = promisify(session.destroy).bind(session);
    await asyncDestroy();
  }

  public async update(session: Express.Session, data: GenericObject): Promise<void> {
    if (!session || !data) return;

    const asyncSave = promisify(session.save).bind(session);
    /* eslint-disable-next-line */
    Object.keys(data).forEach((key) => { if (key !== 'id') session[key] = data[key]; });
    this.setTtl(session);
    await asyncSave();
  }

  public async reload(session: Express.Session): Promise<void> {
    if (!session) return;
    const asyncReload = promisify(session.reload).bind(session);
    await asyncReload();
  }

  protected mergeSettings(settings: ISessionSettings): ISessionOptions {
    this._sessionStore = this.createStore(settings.store);
    const result: ISessionOptions = {
      ...this._settings,
      ...settings?.session,

      cookie: {
        ...this._settings.cookie,
        ...settings?.session?.cookie,
      },

      /* eslint-disable-next-line */
      // @ts-ignore
      store: this._sessionStore,
    };
    if (result.expiration) result.cookie.maxAge = result.expiration;
    return result;
  }

  protected createStore(options: ICacheSettings): RedisStore {
    /* eslint-disable-next-line */
    // @ts-ignore
    const SessionStore = connectRedis(expressSession);
    /* eslint-disable-next-line */
    // @ts-ignore
    return new SessionStore({ client: new BaseCacheService(options).db });
  }

  /** Correctly updates session expiration time */
  protected setTtl(session: Express.Session): void {
    /* eslint-disable-next-line */
    session.cookie.expires = new Date(Date.now() + this._settings.cookie.maxAge);
  }
}
