import { log } from './log';
import { isNodeJsEnvironment } from './utils';

/** Attaches exception handlers */
export function attachExceptionHandlers(shouldExitProcessOnError = false): void {
  isNodeJsEnvironment();

  process.on('uncaughtException', (err) => {
    log.error(err, ['UNCAUGHT EXCEPTION']);
    if (shouldExitProcessOnError) process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    log.error(err, ['UNHANDLED REJECTION']);
    if (shouldExitProcessOnError) process.exit(1);
  });
}

/** Attaches node process signals handlers */
export function attachSignalHandlers(additionalSignals: NodeJS.Signals[] = []): void {
  isNodeJsEnvironment();
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGWINCH', ...additionalSignals];
  (signals).forEach((signal) => process.on(signal, () => process.exit(1)));
}
