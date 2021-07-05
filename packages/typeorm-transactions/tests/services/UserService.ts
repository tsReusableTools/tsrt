import { ITransactionManager, Propagation, Transactional as BasicTransactional } from '../../src';

import { IUser, IUserPayload } from '../models';
import { tm, Transactional, connectionName } from '../utils';

export class UsersService {
  constructor(
    private readonly _repositories: IUsersServiceRepositories,
    private readonly _tm: ITransactionManager = tm,
  ) { }

  @Transactional({ propagation: 'REQUIRED' })
  public async transactionallyCreateUser(body: IUserPayload): Promise<IUser> {
    return this._repositories.usersRepository.createUser(body);
  }

  @BasicTransactional({ propagation: 'SEPARATE', connectionName })
  public async transactionallySeparatelyCreateUser(body: IUserPayload): Promise<IUser> {
    return this._repositories.usersRepository.createUser(body);
  }

  public async createUser(body: IUserPayload, propagation: Propagation = 'REQUIRED'): Promise<IUser> {
    const t = await this._tm.transaction({ propagation });

    try {
      const result = await this._repositories.usersRepository.createUser(body);
      await t.commit();
      return result;
    } catch (err) {
      await t.rollback(err);
    }
  }

  public async findAndCountUsers(propagation: Propagation = 'SUPPORT'): Promise<[IUser[], number]> {
    return this._tm.autoTransaction(async () => this._repositories.usersRepository.findAndCountUsers(), { propagation });
  }

  public async deleteUser(userId: number, propagation: Propagation = 'REQUIRED'): Promise<boolean> {
    return this._tm.autoTransaction(async () => this._repositories.usersRepository.deleteUser(userId), { propagation });
  }
}

export interface IUsersServiceRepositories {
  usersRepository: IUsersRepository;
}

export interface IUsersRepository {
  createUser(body: IUserPayload): Promise<IUser>;
  findAndCountUsers(): Promise<[IUser[], number]>;
  deleteUser(userId: number): Promise<boolean>;
}
