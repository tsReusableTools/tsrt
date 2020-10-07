import { LoggerOptions, Logger } from 'winston';

export type LoggerLevels = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

export interface ILoggerSettings {
  level?: LoggerLevels;
  env?: string;
  service?: string;
  prod?: boolean;
  console?: boolean;
  customFormat?: boolean;
  silent?: boolean;

  winstonOptions?: LoggerOptions;
}

export interface ILoggerMethod {
  /* eslint-disable-next-line */
  (message: any, _title?: string): Logger;
}
