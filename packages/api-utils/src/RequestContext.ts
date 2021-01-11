import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as contextStore from 'express-http-context';

import { combineMiddlewares } from './utils';

export class RequestContext<T extends GenericObject> {
  public get use(): RequestHandler {
    return combineMiddlewares(contextStore.middleware, this.bind);
  }

  public set(initialContext?: T): T {
    if (!initialContext) return;

    Object.keys(initialContext).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(initialContext, key)) contextStore.set(key, initialContext[key]);
    });

    return this.get();
  }

  public get(): T;
  public get<K extends keyof T>(key?: K): T[K];
  public get<K extends keyof T>(key?: K): T | T[K] {
    if (key) return contextStore.get(String(key));

    const context = { ...contextStore.ns.active };
    delete context.id;
    delete context._ns_name;

    return context;
  }

  /** Middleware to bind context to req & res */
  private bind(req: Request, res: Response, next: NextFunction): void {
    contextStore.ns.bindEmitter(req);
    contextStore.ns.bindEmitter(res);
    next();
  }
}

/* eslint-disable-next-line */
export interface IRequestContext { }

/** Default requestContext to be used without instanciating new instance. */
export const requestContext = new RequestContext<IRequestContext>();
