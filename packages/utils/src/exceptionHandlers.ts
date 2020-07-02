import { log } from './log';

/** Attaches exception handlers */
export function attachExceptionHandlers(): void {
  if (!process) return;

  process.on('uncaughtException', (err) => {
    log.error(err.message || err, ['UNCAUGHT EXCEPTION CAUGHT']);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    log.error(err, ['UNHANDLED REJECTION CAUGHT']);
    process.exit(1);
  });
}

/** Attaches node process signals handlers */
export function attachSignalHandlers(additionalSignals: NodeJS.Signals[] = []): void {
  if (!process) return;
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGWINCH', ...additionalSignals];
  (signals).forEach((signal) => process.on(signal, () => process.exit(1)));
}
