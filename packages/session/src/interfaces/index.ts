import { SessionOptions } from 'express-session';
import { ICacheSettings } from '@tsd/cache';
import '@tsd/types';

export interface ISessionSettings {
  store: ICacheSettings;
  session: ISessionOptions;
}

export interface ISessionOptions extends SessionOptions {
  expiration?: number;
}
