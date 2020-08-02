import { join } from 'path';
import { config } from 'dotenv';
import { SequelizeOptions } from 'sequelize-typescript';

import { getEnvProp } from '@tsu/utils';
import { ISessionConfig } from '@tsu/api';

config();

export const COMMIT = getEnvProp('LAUNCH_COMMIT', '');

export const DATE_TIME = getEnvProp('LAUNCH_DATE_TIME', new Date().toISOString());

export const DOMAIN = getEnvProp('DOMAIN');

export const PORT = getEnvProp('PORT');

export const API = getEnvProp('API');

/** UI static files path */
export const STATIC = process.env.NODE_ENV !== 'production'
  ? join(__dirname, '../../../client/dist/my-hub-client')
  : join(__dirname, '../client');

/** Auth config */
export const AUTH = {
  TOKEN_SECRET: getEnvProp('TOKEN_SECRET'),
  TOKEN_EXPIRATION: getEnvProp('TOKEN_EXPIRATION'),
  TOKEN_COOKIE: getEnvProp('TOKEN_COOKIE'),
  SALT_ROUNDS: +getEnvProp('SALT_ROUNDS'),
};

/** App PostgreSQL Config */
export const PSQL: SequelizeOptions = {
  host: getEnvProp('PGHOST'),
  port: +getEnvProp<number>('PGPORT'),
  database: getEnvProp('PGDATABASE'),
  username: getEnvProp('PGUSER'),
  password: getEnvProp('PGPASSWORD'),
  dialect: 'postgres',
  logging: false,
};

/** App Session props */
export const SESSION: ISessionConfig = {
  NAME: getEnvProp('SESSION_NAME'),
  SECRET: getEnvProp('SESSION_SECRET'),
  CRYPT_SECRET: getEnvProp('SESSION_CRYPT_SECRET'),
  EXPIRATION: +getEnvProp('SESSION_EXPIRATION'),
  STORE: {
    URL: getEnvProp('REDIS_SESSION_URL'),
    PWD: getEnvProp('REDIS_PWD'),
  },
  API_BASE: API,
  // DOMAIN: getEnvProp('DOMAIN'),
};

/** Directory for static custom files */
export const STATIC_DIR = join(__dirname, '../static');

/** Logging level for winston logger */
export const { LOG_LEVEL } = process.env;

/** Turns on silent mode for winston logger if testing (NODE_ENV=testing) */
export const LOG_SILENT = process.env.NODE_ENV === 'testing';
