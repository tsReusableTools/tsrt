# Typescript Reusable Tools: Logger

[![npm version](https://img.shields.io/npm/v/@tsrt/logger.svg)](https://www.npmjs.com/package/@tsrt/logger) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/logger.svg)](https://www.npmjs.com/package/@tsrt/logger) [![Downloads](https://img.shields.io/npm/dm/@tsrt/logger.svg)](https://www.npmjs.com/package/@tsrt/logger)


Common customizable logger built on top of awesome [Winston](https://www.npmjs.com/package/winston).

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.

So prefer using exact version instead of version with `~` or `^`.

## Usage

```ts
import { Logger } from '@tsrt/logger';

const log = new Logger({
  ...
});
```

## API Reference

```ts
export declare class Logger {
  constructor(settings?: ILoggerSettings);

  /** Method to setup/update settings after Logger instance was created. */
  setup(settings?: ILoggerSettings): void;

  debug(message: any, _title?: string): Logger;
  verbose(message: any, _title?: string): Logger;
  info(message: any, _title?: string): Logger;
  warn(message: any, _title?: string): Logger;
  error(message: any, _title?: string): Logger;
}

export declare type LoggerLevels = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

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

```

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
