/* eslint-disable import/first */
import { assert } from 'chai';
import { Connection, Repository } from 'typeorm';

import { createTransactionsNamespace, execInTransactionsNamespace, patchTypeOrmRepository, TransactionManager } from '../src';

createTransactionsNamespace();
patchTypeOrmRepository(Repository.prototype);

import { Database } from './utils';
import { User } from './models';
import { UsersRepository } from './repositories';

const tm = new TransactionManager({ connectionName: 'lala' });
execInTransactionsNamespace(() => {
  describe('Testing Database factory', () => {
    let database: Database;

    before(async () => {
      database = new Database();
      await database.createConnection();
      await database.connection.synchronize(true);
    });

    after(async () => {
      await database.closeConnection();
    });

    it('it should test connection', async () => {
      assert.instanceOf(database.connection, Connection);
    });

    it('it should create user', async () => {
      async function separateTransaction(): Promise<void> {
        const repo = database.connection.getCustomRepository(UsersRepository);
        // const t = await tm.transaction({ propagation: 'SEPARATE' });
        const t = await tm.transaction();

        try {
          // const repo = new UsersRepository(database.connection.manager);
          // const repo = database.connection.getCustomRepository(UsersRepository);
          const userInTest = await repo.createUser({ firstName: 'user in separate transaction', lastName: 'lastName', age: 26 });
          console.log('user in separate transaction >>>', userInTest);
          // throw new Error('asdasdasd');
          await t.commit();
        } catch (err2) {
          console.log('err2 >>>', err2);
          await t.rollback(err2);
        }
      }

      // await separateTransaction();
      const t2 = await tm.transaction();
      // const us = new UserService(tm, t.repositories.usersRepository);

      try {
        const repo = new UsersRepository(database.connection.manager);
        // const repo = database.connection.getCustomRepository(UsersRepository);
        const user = await repo.createUser({ firstName: 'first user', lastName: 'lastName', age: 26 });
        console.log('first user >>>', user);
        await separateTransaction();
        if (tm instanceof TransactionManager) {
          const [users] = await repo.findAndCountUsers();
          console.log('users before Test error >>>', users);
          throw new Error('Test');
        }
        const user2 = await repo.createUser({ firstName: 'second user', lastName: 'lastName', age: 26 });
        console.log('second user >>>', user2);
        await t2.commit();
      } catch (err) {
        console.log('err >>>', err);
        await t2.rollback();
      }
    });

    it('it should list users', async () => {
      // const [users, count] = await userService.findAndCountUsers();
      const [users, count] = await database.connection.getRepository(User).findAndCount();
      console.log('users >>>', users);
      assert.equal(count, 0);
    });
  });
});
