/* eslint-disable import/first */
import { assert } from 'chai';
import { Connection, Repository, getManager, EntityManager } from 'typeorm';

import { getManagerFromNs, createTransactionsNamespace, execInTransactionsNamespace } from '../src/utils';
import { patchTypeOrmRepository } from '../src/BaseRepository';

createTransactionsNamespace();
patchTypeOrmRepository(Repository.prototype);

import { TransactionManager } from '../src/TransactionManager';

import { Database } from './utils';
import { User } from './models';
import { UsersRepository } from './repositories';
import { UserService } from './services';

const tm = new TransactionManager({ repositories: { usersRepository: UsersRepository }, connectionName: 'lala' });
execInTransactionsNamespace(() => {
  describe('Testing Database factory', () => {
    let database: Database;
    let userService: UserService;

    before(async () => {
      database = new Database();
      await database.createConnection();
      await database.connection.synchronize(true);

      // userService = new UserService(database.connection.getCustomRepository(UsersRepository));
      userService = new UserService(tm, tm.repositories.usersRepository);
    });

    after(async () => {
      await database.closeConnection();
    });

    it('it should test connection', async () => {
      assert.instanceOf(database.connection, Connection);
    });

    it('it should create user', async () => {
      async function test(): Promise<void> {
        const t = await tm.transaction();

        try {
          // const repo = new UsersRepository(database.connection.manager);
          const repo = database.connection.getCustomRepository(UsersRepository);
          const user3 = await repo.createUsers({ firstName: 'firstName', lastName: 'lastName', age: 26 });
          console.log('user3 >>>', user3);
          throw new Error('asdasdasd');
          await t.commit();
        } catch (err2) {
          console.log('err2 >>>', err2);
          await t.rollback(err2);
          // throw err2;
        }
      }

      const t = await tm.transaction();
      // const us = new UserService(tm, t.repositories.usersRepository);

      try {
        const repo = new UsersRepository(database.connection.manager);
        // const repo = database.connection.getCustomRepository(UsersRepository);
        const user = await repo.createUsers({ firstName: 'firstName', lastName: 'lastName', age: 26 });
        console.log('user >>>', user);
        await test();
        if (tm instanceof TransactionManager) {
          const [users1] = await repo.findAndCountUsers();
          console.log('users1 >>>', users1);
          throw new Error('Test');
        }
        const user2 = await repo.createUsers({ firstName: 'firstName', lastName: 'lastName', age: 26 });
        console.log('user2 >>>', user2);
        await t.commit();
      } catch (err) {
        console.log('err >>>', err);
        await t.rollback();
      }

      // try {
      //   const user = await us.createUser({ firstName: 'firstName', lastName: 'lastName', age: 26 });
      //   if (tm instanceof TransactionManager) throw new Error('Test');
      //   const user2 = await us.createUser({ firstName: 'firstName', lastName: 'lastName', age: 26 });
      //   console.log('user >>>', user);
      //   console.log('user2 >>>', user2);
      //   await t.commit();
      // } catch (err) {
      //   await t.rollback();
      // }
    });

    it('it should list users', async () => {
      // const [users, count] = await userService.findAndCountUsers();
      const [users, count] = await database.connection.getRepository(User).findAndCount();
      console.log('users >>>', users);
      assert.equal(count, 0);
    });
  });
});
