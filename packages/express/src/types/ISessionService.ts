import { Response, RequestHandler } from 'express';

/** Interface for SessionOptions */
export interface ISessionOptions {
  host: string;
  ip: string;
  time: number;
  random: number;
}

/** Interface for session service config */
export interface ISessionConfig {
  NAME: string;
  SECRET: string;
  CRYPT_SECRET: string;
  EXPIRATION: number;
  STORE: {
    PWD: string;
    URL: string;
  };
  USER_INFO_EXPIRATION?: number;
  API_BASE?: string;
}

/** Interface for default data stored in session */
export interface ISession extends GenericObject {
  accessToken: string;
  username: string;
  client: string;
  awsTenantId: string;
  cookieName: string;
  tenantId: string | number;
  divisionId: string | number;
  email: string;
  idToken: string;
  refreshToken: string;
  tokenExpiresAt?: string;
  sessionExpiresAt?: string;
}

/* eslint-disable-next-line */
declare global { namespace Express { interface SessionData extends ISession {} } }

/** Interface for SessionService */
export interface ISessionService {
  /**
   *  Initializes service. This one should be called before any othet method.
   *
   *  @param config - Sessino config necessary for service functionality.
   */
  launch(config: ISessionConfig): RequestHandler;

  /**
   *  Gets session by Id
   *
   *  @param sessionId - Session id
   */
  getById(sessionId: string): IMsgPromise<Express.Session>;

  /**
   *  Updates session
   *
   *  @param session - Current session
   *  @param data - Data to update session with
   */
  update(session: Express.Session, data: GenericObject): Promise<void>;

  /**
   *  Updates session by Id
   *
   *  @param sessionId - Session id
   *  @param data - Data to update session with
   */
  updateById(
    sessionId: string, data: GenericObject
  ): IMsgPromise<Express.Session>;

  /**
   *  Destroy session
   *
   *  @param session - Current session
   *  @param res - Express response stream
   */
  destroy(session: Express.Session, res: Response): Promise<void>;

  /**
   *  Destroys session ny Id
   *
   *  @param sessionId - Session id
   */
  destroyById(sessionId: string): IMsgPromise;

  /**
   *  Checks session and returns 'true' if Ok, or 'false' if not Ok.
   *  Also destroy session if not Ok
   *
   *  @param session - Current session
   *  @param [res] - Express response stream
   */
  checkSession?(session: Express.Session, res?: Response): Promise<boolean>;

  /**
   *  Decrypts and parses key
   *
   *  @param key - Encrypted key
   */
  decrypt(key: string): ISessionOptions;
}
