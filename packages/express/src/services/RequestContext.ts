/* eslint-disable import/no-extraneous-dependencies */
import { Request, Response, NextFunction, Router } from 'express';
import * as contextStore from 'express-http-context';

import { singleton } from '@ts-utils/utils';

// Decided to declare it in global because it is impossible augments this interface in then another
// module, which imports it from cs-common-lib, while cs-common-lib is not correctly built via webpack
// and while there is no single index.d.ts file
declare global {
  /** Interface for Request Context object */
  /* eslint-disable-next-line */
  export interface IRequestContext { }
}

/** Constructor for common request context manager */
export class RequestContextConstructor {
  /**
   *  Attaches context to provided Express router instance.
   *
   *  @param router - Express router instance
   */
  public attachContext = (router: Router): Router => router.use(contextStore.middleware, this.bind);

  /**
   *  Sets current request context.
   *
   *  @param initialContext - Request initial context props
   */
  public set(initialContext?: IRequestContext): IRequestContext {
    if (initialContext) {
      Object.keys(initialContext).forEach((prop) => {
        if (Object.prototype.hasOwnProperty.call(initialContext, prop)) {
          contextStore.set(prop, (initialContext as GenericObject)[prop]);
        }
      });
    }

    return this.get();
  }

  /** Gets current request context */
  public get(): IRequestContext;
  public get<K extends keyof IRequestContext>(prop?: K): IRequestContext[K];
  public get<K extends keyof IRequestContext>(prop?: K): IRequestContext | IRequestContext[K] {
    if (prop) return contextStore.get(String(prop));

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

/** Service to manage current http request context over app */
export const RequestContext = singleton(RequestContextConstructor);
