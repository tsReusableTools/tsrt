import { RequestHandler } from 'express';

import { parseTypes } from '@tsd/utils';

/**
 *  Combines multiple middlewares into one.
 *
 *  @param middlewares - Middlewares to combine.
 */
export function combineMiddlewares(...middlewares: RequestHandler[]): RequestHandler {
  return middlewares.reduce((a, b) => (req, res, next): void => {
    a(req, res, (err: unknown) => {
      if (err) return next(err);
      b(req, res, next);
    });
  });
}

/**
 *  Get prop from .env, throwing error if prop does not found.
 *
 *  @param prop - Property name to get from .env.
 *  @param [defaultValue] - Default value for prop. If it is provided - no error will be thrown.
 */
export function getEnvProp<T extends string | number | boolean = string>(prop: string, defaultValue?: T): T {
  if (process.env[prop]) return parseTypes(process.env[prop]) as T;

  if (
    !process.env[prop]
    && (defaultValue || defaultValue === '' || defaultValue === 0 || defaultValue === false)
  ) return parseTypes(defaultValue);

  if (!process.env[prop] && !defaultValue && process.env.NODE_ENV !== 'testing') {
    throw new Error(`There is no prop: '${prop}' found in provided .env file`);
  }
}
