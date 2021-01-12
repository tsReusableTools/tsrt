import { isNodeJsEnvironment } from '@tsrt/utils';

/** Attaches exception handlers */
export function attachExceptionHandlers(options?: IExceptionHandlersOptions): void {
  isNodeJsEnvironment();

  process.on('uncaughtException', (err) => {
    if (options?.logger) options.logger.error({ message: err });
    if (options?.shouldExitProcessOnError) process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    if (options?.logger) options.logger.error({ message: err });
    if (options?.shouldExitProcessOnError) process.exit(1);
  });
}

/** Attaches node process signals handlers */
export function attachSignalHandlers(additionalSignals: NodeJS.Signals[] = []): void {
  isNodeJsEnvironment();
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGWINCH', ...additionalSignals];
  (signals).forEach((signal) => process.on(signal, () => process.exit(1)));
}

export interface IExceptionHandlersOptions {
  shouldExitProcessOnError?: boolean;
  logger: {
    error(data: any, ...args: any[]): any;
  },
}
