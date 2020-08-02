import { Controller, Get, Post, Status, Required, BodyParams, HeaderParams, Session } from '@tsed/common';
import { Responses } from '@tsed/swagger';

import { AuthService } from '@lib/services';

@Controller('/auth')
export class AuthController {
  @Post('/sign-in')
  @Status(200)
  @Responses(400, { description: 'Bad Request' })
  @Responses(401, { description: 'Unauthorized' })
  public async signIn(
    @Session() session: Express.Session,
      @Required() @BodyParams('email') email: string,
      @Required() @BodyParams('password') password: string,
  ): Promise<GenericObject> {
    return AuthService.signIn(email, password, session);
  }

  @Post('/sign-up')
  @Status(200)
  @Responses(400, { description: 'Bad Request' })
  @Responses(401, { description: 'Unauthorized' })
  public async signUp(
    @Session() session: Express.Session,
      @Required() @BodyParams('email') email: string,
      @Required() @BodyParams('password') password: string,
  ): Promise<GenericObject> {
    return AuthService.signUp(email, password, session);
  }

  @Get('/sign-out')
  // TODO: change response to 204 after changing client UI code to work properly w/ status 204
  @Status(200)
  @Responses(400, { description: 'Bad Request' })
  @Responses(401, { description: 'Unauthorized' })
  public async signOut(
    @Session() session: Express.Session,
      @HeaderParams('authorization') authorization: string,
  ): Promise<void> {
    return AuthService.sighOut(session, authorization);
  }

  @Get('/verify')
  @Status(200)
  @Responses(400, { description: 'Bad Request' })
  @Responses(401, { description: 'Unauthorized' })
  public async verify(
    @Session() session: Express.Session,
      @HeaderParams('authorization') authorization: string,
  ): Promise<GenericObject> {
    return AuthService.verify(session, authorization);
  }
}
