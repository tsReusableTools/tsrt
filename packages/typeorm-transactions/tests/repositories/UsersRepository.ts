import { AbstractRepository, Repository, EntityManager, EntityRepository, FindManyOptions } from 'typeorm';

import { User, IUser, IUserPayload } from '../models';
// import { BaseRepository } from '../../src/BaseRepository';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  constructor(public readonly manager: EntityManager) { super(); }

  public async createUser(body: IUserPayload): Promise<IUser> {
    const user = this.manager.create(User, body);
    return this.manager.save(User, user);
  }

  public async findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
    return this.manager.findAndCount(User, options);
  }
}

// @EntityRepository(User)
// export class UsersRepository extends AbstractRepository<User> {
//   public async createUser(body: IUserPayload): Promise<IUser> {
//     const user = this.manager.create(User, body);
//     return this.manager.save(User, user);
//   }

//   public async findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
//     return this.manager.findAndCount(User, options);
//   }
// }
