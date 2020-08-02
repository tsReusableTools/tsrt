import { hash, genSalt } from 'bcrypt';

import { BaseRepository } from '@tsu/orm-sequelize';

import { AUTH } from '@utils/config';
import { User } from '@dal/models';
import { IUser } from '@dal/interfaces';

class UsersRepositoryClass extends BaseRepository<IUser> {
  public constructor() { super(User); }

  protected async onBeforeCreate(body: IUser): Promise<void> {
    if (!body.password) return;

    const salt = await genSalt(AUTH.SALT_ROUNDS);
    /* eslint-disable-next-line */
    body.password = await hash(String(body.password), salt);
  }

  protected async onBeforeUpdate(_id: GenericId, body: GenericObject): Promise<void> {
    if (!body.password) return;

    const salt = await genSalt(AUTH.SALT_ROUNDS);
    /* eslint-disable-next-line */
    body.password = await hash(String(body.password), salt);
  }
}

export const UsersRepository = new UsersRepositoryClass();
