import { LoggerOptions, Logger } from 'winston';

export type LoggerLevels = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

export interface ILoggerSettings {
  /** `Winston` Logger level. @default debug. */
  level?: LoggerLevels;

  /** `Winston` Logger env. @default dev. */
  env?: string;

  /** Whether Logger in `prod` mode. In prod mode there is no beautify options used. @default false. */
  prod?: boolean;

  /** Service name, where `Logger` is used. */
  service?: string;

  /** Whether to add Winston `Console` transport by default. @default true. */
  console?: boolean;

  /** Whether to apply custom format. @default true. */
  customFormat?: boolean;

  /** `Winston` Logger `silent` option. @default false. */
  silent?: boolean;

  /** Other `Winston` options. */
  winstonOptions?: LoggerOptions;
}

export interface ILoggerMethod {
  /* eslint-disable-next-line */
  (message: any, _title?: string): Logger;
}
