import { applyDecorators } from '@tsed/core';
import { Middleware, IMiddleware, UseAuth, IAuthOptions, HeaderParams, Session, registerMiddleware } from '@tsed/common';

@Middleware()
export class AuthorizedMiddleware implements IMiddleware {
  public async use(@Session() session: Express.Session, @HeaderParams('authorization') authorization: string): Promise<void> {
    // await AuthService.verify(session, authorization);
  }
}

/** Auth decorator for routes usage */
export function Authorized(options: IAuthOptions = { }): Function {
  return applyDecorators(
    UseAuth(AuthorizedMiddleware, options),
  );
}

registerMiddleware(Authorized);
