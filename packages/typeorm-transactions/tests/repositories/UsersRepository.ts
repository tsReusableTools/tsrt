import { Repository, EntityManager, EntityRepository, FindManyOptions } from 'typeorm';

import { User, IUser, IUserPayload } from '../models';

@EntityRepository(User) // This is not necessary. Just for anility to use via connection.getCustomRepoistory().
export class UsersRepository extends Repository<User> {
  // constructor(public readonly manager: EntityManager) { super(); } // This is not necessary. Just for ability to call via new operator.

  public async createUser(body: IUserPayload): Promise<IUser> {
    const user = this.manager.create(User, body);
    return this.manager.save(User, user);
  }

  public async findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
    return this.manager.findAndCount(User, options);
  }

  public async deleteUser(userId: number): Promise<boolean> {
    const result = await this.manager.delete(User, userId);
    return !!result.affected;
  }
}
