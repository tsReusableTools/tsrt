import { AbstractRepository, Repository, EntityManager, EntityRepository, FindManyOptions } from 'typeorm';

import { User, IUser, IUserPayload } from '../models';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  constructor(public readonly manager: EntityManager) { super(); }

  public async createUsers(body: IUserPayload): Promise<IUser> {
    const user = this.manager.create(User, body);
    return this.manager.save(User, user);
  }

  public async findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
    // console.log('this.manager >>>', this.manager);
    return this.manager.findAndCount(User, options);
  }
}

// @EntityRepository(User)
// export class UsersRepository extends AbstractRepository<User> {
//   public async create(body: IUserPayload): Promise<IUser> {
//     const user = this.manager.create(User, body);
//     return this.manager.save(User, user);
//   }

//   public async findAndCount(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
//     return this.manager.findAndCount(User, options);
//   }
// }
