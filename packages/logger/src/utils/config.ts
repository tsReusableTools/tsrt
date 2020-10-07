import { ILoggerSettings } from '../interfaces';

export const defaultLoggerSettings: ILoggerSettings = {
  env: 'dev',
  level: 'debug',
  prod: false,
  console: true,
  customFormat: true,
  silent: false,
  winstonOptions: { },
};
