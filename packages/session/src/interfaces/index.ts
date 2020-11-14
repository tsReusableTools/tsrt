import { SessionOptions } from 'express-session';
import { ICacheSettings } from '@tsrt/cache';
import '@tsrt/types';

export interface ISessionSettings {
  store: ICacheSettings;
  session: ISessionOptions;
}

export interface ISessionOptions extends SessionOptions {
  expiration?: number;
}
