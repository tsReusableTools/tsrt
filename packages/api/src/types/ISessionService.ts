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

  getById(sessionId: string): Promise<Express.Session>;

  update(session: Express.Session, data: GenericObject): Promise<void>;

  updateById(sessionId: string, data: GenericObject): Promise<Express.Session>;

  destroy(session: Express.Session, res: Response): Promise<void>;

  /* eslint-disable-next-line */
  destroyById(sessionId: string): Promise<any>;

  /**
   *  Checks session and returns 'true' if Ok, or 'false' if not Ok.
   *  Also destroy session if not Ok
   *
   *  @param session - Current session
   *  @param [res] - Express response stream
   */
  checkSession?(session: Express.Session, res?: Response): Promise<boolean>;

  decrypt(key: string): ISessionOptions;
}
