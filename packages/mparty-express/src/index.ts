import { RequestHandler } from 'express';

import { Mparty, IMpartyLimits } from '@tsrt/mparty';

import { MpartyMiddleware, IMpartyMiddlewareOptions } from './types';
import { throwErrorIfMiddlewareIsNotCalled, getMpartyOptions } from './utils';

export function createMpartyMiddleware(options: IMpartyMiddlewareOptions): MpartyMiddleware {
  const mparty = new Mparty();

  function mpartyMiddleware(limits?: IMpartyLimits): RequestHandler;
  function mpartyMiddleware(filesFields?: string[], limitations?: IMpartyLimits): RequestHandler;
  function mpartyMiddleware(filesFields?: string[] | IMpartyLimits, limitations?: IMpartyLimits): RequestHandler {
    throwErrorIfMiddlewareIsNotCalled(filesFields);

    const limits = {
      ...options.limits,
      ...limitations,
      ...(!Array.isArray(filesFields) && filesFields),
    };
    if (Array.isArray(filesFields)) limits.allowedFiles = filesFields;

    return async function uploadHandler(req, res, next): Promise<void> {
      try {
        const mpartyOptions = await getMpartyOptions(req, options);

        const { fields, files, file } = await mparty.upload(req, { ...mpartyOptions, limits });

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
