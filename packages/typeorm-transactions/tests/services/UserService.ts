import { FindManyOptions } from 'typeorm';

import { TransactionManager, ITransactionManager, Repository } from '../../src/TransactionManager';

import { User, IUser, IUserPayload } from '../models';

export class UserService {
  constructor(
    private readonly _tm: ITransactionManager<UserServiceRepositories>,
    private readonly usersRepository: IUserServiceUserRepository,
  ) { }

  public async createUser(body: IUserPayload): Promise<IUser> {
    const t = await this._tm.transaction();
    // eslint-disable-next-line new-cap
    // const repo = new this.usersRepository(t.manager);
    // const repo = this.usersRepository;
    const repo = t.repositories.usersRepository;

    try {
      const result = await repo.createUsers(body);
      await t.commit();
      return result;
    } catch (err) {
      await t.rollback(err);
    }
  }

  public async findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]> {
    // eslint-disable-next-line new-cap
    // const repo = new this.usersRepository(this._tm.connection.manager);
    // const repo = this.usersRepository;
    const repo = this._tm.repositories.usersRepository;
    return repo.findAndCountUsers(options);
  }
}

export interface IUserServiceUserRepository {
  createUsers(body: IUserPayload): Promise<IUser>;
  findAndCountUsers(options?: FindManyOptions<User>): Promise<[IUser[], number]>;
}

type UserServiceRepositories = {
  usersRepository: Repository<IUserServiceUserRepository>;
}
