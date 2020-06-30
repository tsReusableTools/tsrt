import chalk from 'chalk';
/* eslint-disable import/no-extraneous-dependencies */
import { createLogger, transports, format, LoggerOptions } from 'winston';

import { ILogger, ICustomLogger } from './types';
import { singleton } from './utils';

/** Helper -> define standart chalk color */
const defineColor = (lvl: string, title: string): string => {
  let type: string;

  if (lvl.indexOf('info') !== -1) type = chalk.green(title);
  else if (lvl.indexOf('warn') !== -1) type = chalk.yellow(title);
  else if (lvl.indexOf('error') !== -1) type = chalk.red(title);
  else if (lvl.indexOf('verbose') !== -1) type = chalk.cyan(title);
  else if (lvl.indexOf('debug') !== -1) type = chalk.hex('#9b69ff')(title);
  else type = chalk.yellow(title);

  return type;
};

/** Custom format for winston logger */
const myFormat = format.printf((props) => {
  const { level: lvl, message, 0: zero, 1: first, color, caption } = props;

  let customCaption: string;
  let customColor: string;

  // Specify caption & color
  if (color) customColor = color;
  if (caption) customCaption = caption;
  if (first && typeof first === 'string') customColor = first;
  if (zero && typeof zero === 'string') customCaption = zero;
  if (zero && typeof zero === 'object') {
    if (zero.caption) customCaption = zero.caption;
    if (zero.color) customColor = zero.color;
  }

  const lvlUpperCase = lvl.toUpperCase();

  const title = `[${new Date().toISOString()}] [${customCaption || lvlUpperCase}]`;

  let type: string;

  if (customColor) {
    try {
      /* eslint-disable-next-line */
      type = (chalk as any)[customColor](title);
    } catch (err) { type = defineColor(lvl, title); }
  } else {
    type = defineColor(lvl, title);
  }

  // Uncomment it to see default output
  // return `${lvl}: ${typeof message === 'object'
  //   ? JSON.stringify(message)
  //   : message}`;

  console.log(`${type}\n`, message);
  return ' ';
});

/** Custom winston logger, for generating pretty logs over app */
class Logger {
  private _log: ILogger;

  public info: ICustomLogger;
  public error: ICustomLogger;
  public warn: ICustomLogger;
  public debug: ICustomLogger;
  public verbose: ICustomLogger;

  constructor(options: LoggerOptions = { }) {
    this.init(options);
  }

  public init(options: LoggerOptions = { }): void {
    this._log = createLogger({
      ...options,
      format: format.combine(
        format.splat(),
        format.simple(),
        myFormat,
      ),
      transports: [new transports.Console()],
    });

    this.info = this._log.info.bind(this._log);
    this.error = this._log.error.bind(this._log);
    this.warn = this._log.warn.bind(this._log);
    this.debug = this._log.debug.bind(this._log);
    this.verbose = this._log.verbose.bind(this._log);
  }
}

export const log = singleton(Logger);
