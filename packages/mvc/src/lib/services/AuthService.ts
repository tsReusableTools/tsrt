import { compare } from 'bcrypt';
import { verify, sign } from 'jsonwebtoken';

import { SessionService } from '@tsu/api';
import { singleton, throwHttpError } from '@tsu/utils';

import { AUTH } from '@utils/config';
import { UsersRepository } from '@dal/repositories';

class AuthServiceSingleton {
  public async signIn(email: string, password: string, session?: Express.Session): Promise<GenericObject> {
    if (!email || !password) throwHttpError.unAuthorized('Invalid password or email provided');

    const user = await UsersRepository.read({ getBy: 'email' }, email);

    const result = await compare(password, user.password);
    if (!result) throwHttpError.unAuthorized('Invalid password or email provided');

    return this.createTokenAndSession(user, session);
  }

  public async signUp(email: string, password: string, session?: Express.Session): Promise<GenericObject> {
    try {
      if (!email || !password) throwHttpError.badRequest('Password and email should be provided');

      const user = await UsersRepository.read({ getBy: 'email' }, email);
      if (user) throwHttpError.conflict('User with this email already exists');
    } catch (err) {
      if (err.status === 409) throwHttpError.conflict(err.data);
      const newUser = await UsersRepository.create({ email, password });
      return this.createTokenAndSession(newUser, session);
    }
  }

  public async sighOut(session?: Express.Session, authorization?: string): Promise<void> {
    await this.verify(session, authorization);
    if (session) SessionService.destroy(session);
  }

  public async verify(session?: Express.Session, authorization?: string): Promise<GenericObject> {
    try {
      return this.verifyToken((session && session.accessToken) || authorization);
    } catch (err) {
      if (session) await SessionService.destroy(session);
      throwHttpError(err.status, err.data);
    }
  }

  private async verifyToken(token: string): Promise<GenericObject> {
    try {
      const authorization = this.getTokenFromHeader(token);
      return verify(authorization, AUTH.TOKEN_SECRET) as GenericObject;
    } catch (err) {
      throwHttpError.unAuthorized('Invalid password or email provided');
    }
  }

  private async createTokenAndSession(payload: GenericObject, session?: Express.Session): Promise<GenericObject> {
    const accessToken = this.createToken(payload);

    const result = await this.verifyToken(accessToken);
    if (session) await SessionService.update(session, { ...result, accessToken });
    return result;
  }

  private createToken(payload: GenericObject): string {
    return sign(payload, AUTH.TOKEN_SECRET, { expiresIn: AUTH.TOKEN_EXPIRATION });
  }

  private getTokenFromHeader(authorization: string): string {
    return authorization ? authorization.replace('Bearer ', '') : '';
  }
}

export const AuthService = singleton(AuthServiceSingleton);
