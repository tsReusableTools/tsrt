import { RequestHandler } from 'express';

import { Mparty } from '@tsrt/mparty';

import { MpartyMiddleware, IMpartyMiddlewareOptions } from './types';
import { throwErrorIfMiddlewareIsNotCalled, getMpartyOptions } from './utils';

export function createMpartyMiddleware(options: IMpartyMiddlewareOptions): MpartyMiddleware {
  const mparty = new Mparty();

  function mpartyMiddleware(routeOptions?: IMpartyMiddlewareOptions): RequestHandler;
  function mpartyMiddleware(filesFields?: string[], routeOptions?: IMpartyMiddlewareOptions): RequestHandler;
  function mpartyMiddleware(filesFields?: string[] | IMpartyMiddlewareOptions, routeOptions?: IMpartyMiddlewareOptions): RequestHandler {
    throwErrorIfMiddlewareIsNotCalled(filesFields);

    const limits = {
      ...options.limits,
      ...routeOptions?.limits,
      ...(!Array.isArray(filesFields) && filesFields?.limits),
    };
    if (Array.isArray(filesFields)) limits.allowedFiles = filesFields;

    const mergedOptions = { ...options, ...routeOptions, limits };

    return async function uploadHandler(req, res, next): Promise<void> {
      try {
        const mpartyOptions = await getMpartyOptions(req, mergedOptions);

        const { fields, files, file } = await mparty.upload(req, mpartyOptions);

        req.body = fields;
        req.files = files;
        req.file = file;

        next();
      } catch (err) {
        next(err);
      }
    };
  }

  return mpartyMiddleware;
}
