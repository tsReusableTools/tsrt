/* eslint-disable-next-line */
import { Format, FormatWrap, TransformableInfo } from 'logform';
import { createLogger, transports, format as winstonFormat, LoggerOptions, Logger as WinstonLogger } from 'winston';

import { ILoggerSettings, LoggerLevels, ILoggerMethod } from './interfaces';
import { defaultLoggerSettings } from './utils';

export class Logger {
  public debug: ILoggerMethod;
  public verbose: ILoggerMethod;
  public info: ILoggerMethod;
  public warn: ILoggerMethod;
  public error: ILoggerMethod;

  private _log: WinstonLogger;
  private _defaultSettings: ILoggerSettings = defaultLoggerSettings;

  constructor(settings: ILoggerSettings = { }) {
    this.init(settings);
  }

  public setup(settings: ILoggerSettings = { }): void {
    this.init(settings);
  }

  protected init(settings: ILoggerSettings = { }): void {
    const options = this.prepareLoggerOptions(this.mergeSettings(settings));
    this._log = createLogger(options);
    this.bindLoggerMethods();
  }

  private prepareLoggerOptions(settings: ILoggerSettings = { }): LoggerOptions {
    const options: LoggerOptions = {
      ...settings.winstonOptions,
      silent: settings.silent ?? settings.winstonOptions?.silent ?? false,
      level: settings.level ?? settings.winstonOptions?.level ?? 'debug',
      transports: [],
    };

    const formats = [
      winstonFormat.timestamp(),
      winstonFormat.label({ label: settings.env }),
      winstonFormat.json(),
    ];

    if (!settings.prod) formats.push(winstonFormat.prettyPrint({ colorize: true }));
    if (settings.customFormat && !settings.prod) formats.push(...this.customFormats);
    if (settings.prod) formats.unshift(winstonFormat.errors({ stack: true }));

    options.format = winstonFormat.combine(...formats);

    if (settings.service) options.defaultMeta = { ...options.defaultMeta, _service: settings.service };
    if (Array.isArray(options.transports)) {
      if (settings.console) options.transports.push(new transports.Console());

      if (!options.transports.length) throw Error('Please, provide at least one transport for logger instance');
    }

    return options;
  }

  private get customFormats(): Format[] {
    const customFormat = winstonFormat.printf(({ level, message, timestamp, _title }) => {
      console.log(`${timestamp} - ${level} -${_title ? ` ${_title} -` : ''}`, message);
      return '';
    });

    return [winstonFormat.colorize({ level: true }), customFormat];
  }

  private mergeSettings(settings: ILoggerSettings = { }): ILoggerSettings {
    return { ...this._defaultSettings, ...settings };
  }

  private bindLoggerMethods(): void {
    this.debug = this.wrapMethod('debug');
    this.verbose = this.wrapMethod('verbose');
    this.info = this.wrapMethod('info');
    this.warn = this.wrapMethod('warn');
    this.error = this.wrapMethod('error');
  }

  private wrapMethod(level: LoggerLevels): ILoggerMethod {
    const method: ILoggerMethod = (message, _title?): WinstonLogger => this._log[level]({ message, _title });
    return method;
  }
}

export const log = new Logger();
