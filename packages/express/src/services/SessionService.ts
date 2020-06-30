/* eslint-disable import/no-extraneous-dependencies */
import { promisify } from 'util';

import { Request, Response, RequestHandler } from 'express';
import expressSession from 'express-session';
import RedisStore from 'connect-redis';
import Cryptr from 'cryptr';

import { msg, log, singleton } from '@ts-utils/utils';

import { ISessionOptions, ISessionConfig, ISessionService, ISession } from '../types';
import { BaseCacheService } from './BaseCacheService';

/** Singleton constructor for SessionService */
class SessionServiceSingleton extends BaseCacheService implements ISessionService {
  private cryptr: Cryptr;
  private _config: ISessionConfig;
  private _defaultSessionExp = 86400;

  public constructor() { super(); }

  /** Initiates session middleware */
  public launch(config: ISessionConfig): RequestHandler {
    if (!config) {
      throw Error('Please, provide config for SessionService launch');
    }

    super.init(config.STORE.URL, config.STORE.PWD);

    this._config = { ...config };
    this.cryptr = new Cryptr(this._config.CRYPT_SECRET);

    const cookie = {
      path: '/',
      secure: false,
      httpOnly: true,
      maxAge: (this._config.EXPIRATION || this._defaultSessionExp) * 1000,
    };

    const SessionStore = RedisStore(expressSession);

    return expressSession({
      cookie,
      genid: this.generateSessionId.bind(this),
      name: this._config.NAME,
      resave: false,
      saveUninitialized: true,
      secret: this._config.SECRET,
      store: new SessionStore({ client: this.db }),
    });
  }

  /**
   *  Updates session by Id
   *
   *  @param sessionId - Session id
   */
  public async getById(sessionId: string): IMsgPromise<Express.Session> {
    if (!this._config) throw Error('Please, call `launch` method first');

    const session = await this.get<Express.Session>(`sess:${sessionId}`);

    return session.status >= 400
      ? msg.notFound('Invalid session id') as IMsg
      : session;
  }

  /**
   *  Updates session
   *
   *  @param session - Current session
   *  @param data - Data to update session with
   */
  public async update(session: Express.Session, data: Partial<ISession>): Promise<void> {
    if (!this._config) throw Error('Please, call `launch` method first');

    // Save into session data
    /* eslint-disable-next-line */
    Object.keys(data).forEach((key) => { if (key !== 'id') session[key] = data[key]; });

    this.setTtl(session);

    const asyncSave = promisify(session.save).bind(session);

    await asyncSave()
      .then(() => log.debug('', [`IN SESSION SERVICE: UPDATED SESSION ${session.id}`]))
      .catch((err: Error) => log.error(err.message, ['ERROR IN SESSION SERVICE: UPDATE']));
  }

  /**
   *  Update session by Id
   *
   *  @param sessionId - Session id
   *  @param data - Data to update session with
   */
  public async updateById(sessionId: string, data: Partial<ISession>): IMsgPromise<Express.Session> {
    if (!this._config) throw Error('Please, call `launch` method first');

    const session = await this.get<Express.Session>(`sess:${sessionId}`);
    if (session.status >= 400) {
      return msg.notFound('Invalid session id') as IMsg;
    }

    return this.set<Express.Session>(
      `sess:${sessionId}`, { ...session.data, ...data },
      this._config.EXPIRATION || this._defaultSessionExp,
    );
  }

  /**
   *  Destroy session
   *
   *  @param session - Current session
   *  @param res - Express Response Object
   */
  public async destroy(session: Express.Session, res?: Response): Promise<void> {
    if (!this._config) throw Error('Please, call `launch` method first');

    const asyncDestroy = promisify(session.destroy).bind(session);

    const isExtra = session && !session.accessToken;

    await asyncDestroy()
      .then(() => {
        if (!isExtra) log.debug('', [`IN SESSION SERVICE: DESTROYED SESSION ${session.id}`]);

        // Clear session cookie on client
        if (res && !res.headersSent) {
          res.clearCookie(this._config.NAME);
          if (this._config.API_BASE) res.clearCookie(this._config.NAME, { path: this._config.API_BASE });
        }
      })
      .catch((err: Error) => log.error(err.message, ['ERROR IN SESSION SERVICE: DESTROY']));
  }

  /**
   *  Destroy session by Id
   *
   *  @param sessionId - Session id
   */
  public async destroyById(sessionId: string): IMsgPromise {
    if (!this._config) throw Error('Please, call `launch` method first');

    const session = await this.get(`sess:${sessionId}`);
    if (session.status >= 400) {
      return msg.notFound('Invalid session id');
    }

    return this.del(`sess:${sessionId}`);
  }

  /**
   *  Check session
   *
   *  @param session - Current session
   *  @param [res] - Express Response Object
   */
  public async checkSession(session: Express.Session, res?: Response): Promise<boolean> {
    if (!this._config) throw Error('Please, call `launch` method first');

    if (!session) return false;

    if (res && session && !session.accessToken) {
      await this.destroy(session, res);
      return false;
    }

    if (session && session.accessToken) return true;
  }

  /**
   *  Decrypts encryptd value.
   *
   *  @param value - Value to decrypt.
   */
  public decrypt(value: string): ISessionOptions {
    if (!this._config) throw Error('Please, call `launch` method first');
    return JSON.parse(this.cryptr.decrypt(value));
  }

  /**
   *  Correctly updates session expiration time
   *
   *  @param session - Session
   */
  private setTtl(session: Express.Session): void {
    const expire = (this._config.EXPIRATION || this._defaultSessionExp) * 1000;

    /* eslint-disable-next-line */
    session.cookie.expires = new Date(Date.now() + expire);
  }

  /**
   *  Method for session id generation
   *
   *  @param req - Express Request stream
   */
  private generateSessionId(req: Request): string {
    // Create unique session name
    const options: ISessionOptions = {
      host: req.headers['user-agent'],
      ip: req.ip,
      time: Date.now(),
      random: Math.random() / 100,
    };

    let name = JSON.stringify(options);

    // If session incorrectly created via axios request -> reset its name
    // Else -> encrypt
    if (req.headers['user-agent'] && req.headers['user-agent'].indexOf('axios/') !== -1) {
      name = JSON.stringify({ error: '' });
    } else {
      name = new Cryptr(this._config.CRYPT_SECRET).encrypt(name);
    }

    return name;
  }
}

/** This Service is provided with purpose to handle sessions over app */
export const SessionService = singleton(SessionServiceSingleton);
