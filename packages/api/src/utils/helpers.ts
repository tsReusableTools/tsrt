import { RequestHandler } from 'express';

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
