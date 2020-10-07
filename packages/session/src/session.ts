import { RequestHandler } from 'express';

import { ISessionSettings } from './interfaces';
import { SessionService } from './SessionService';

export function session(settings: ISessionSettings): RequestHandler {
  if (!settings) throw Error('Please, provide valid settings');
  return new SessionService().createMiddleware(settings);
}
