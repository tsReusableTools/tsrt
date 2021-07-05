import { expect } from 'chai';
import { Connection } from 'typeorm';

import { execInTransactionsNamespace } from '../src';

import { Database, tm, connectionName } from './utils';
import { UsersRepository, UsersBaseRepository } from './repositories';
import { UsersService } from './services';

execInTransactionsNamespace(() => {
  describe('Testing Modern API', () => {
    let database: Database;
    let usersService: UsersService;
    let usersBaseService: UsersService;

    before(async () => {
      database = new Database();
      await database.connect();
      await database.connection.synchronize(true);
      usersService = new UsersService({ usersRepository: database.connection.getCustomRepository(UsersRepository) });
      usersBaseService = new UsersService({ usersRepository: new UsersBaseRepository() });
    });

    after(async () => {
      await database.disconnect();
    });

    beforeEach(async () => {
      await database.connection.synchronize(true); // Clean db after each test case.
    });

    it('should test connection', async () => {
      expect(database.connection).to.be.instanceOf(Connection);
      expect(database.connection.isConnected).to.be.equal(true);
      expect(database.connection.name).to.be.equal(connectionName);
    });

    it('should create users using UsersRepository and UsersBaseRepository is same transaction', async () => {
      await tm.transaction(async (t) => {
        await usersService.createUser({ firstName: 'first', lastName: 'first' });
        await usersBaseService.createUser({ firstName: 'second', lastName: 'second' });
        const [, usersCount] = await usersService.findAndCountUsers();

        expect(usersCount).to.equal(2);

        await t.rollback();
        const [, usersCountAfterRollback] = await usersBaseService.findAndCountUsers();

        expect(usersCountAfterRollback).to.equal(0);
      });
    });

    it('should create users using UsersRepository is separate transactions (created w/ propagation = \'SEPARATE\')', async () => {
      const t1 = await tm.transaction();

      const user1 = await usersService.createUser({ firstName: 'first', lastName: 'first' });

      await tm.transaction(async (t2) => {
        await usersService.createUser({ firstName: 'second', lastName: 'second' });
        const [, usersCount] = await usersBaseService.findAndCountUsers();
        expect(usersCount).to.equal(1); // We don't see user created in transaction 1.
        await t2.rollback();
      }, { propagation: 'SEPARATE' });

      await t1.commit();
      const [, usersCountAfterRollback] = await usersService.findAndCountUsers();

      expect(usersCountAfterRollback).to.equal(1);

      await usersService.deleteUser(user1.id);
      const [, usersCountAfterDeletion] = await usersBaseService.findAndCountUsers();

      expect(usersCountAfterDeletion).to.equal(0);
    });

    it('should not rollback if there is no transaction (created w/ propagation = \'SUPPORT\')', async () => {
      const t = await tm.transaction({ propagation: 'SUPPORT' });

      await usersService.createUser({ firstName: 'first', lastName: 'first' });
      await usersBaseService.createUser({ firstName: 'second', lastName: 'second' });

      const [, usersCount] = await usersService.findAndCountUsers();

      expect(usersCount).to.equal(2);

      await t.rollback(); // Rollback has no influence as transaction was not even started w/ propagation: 'SUPPORT'.
      const [, usersCountAfterRollback] = await usersBaseService.findAndCountUsers();

      expect(usersCountAfterRollback).to.equal(2);
    });

    it('should support already created transaction and not create new if propagation = \'SUPPORT\'', async () => {
      const t = tm.createTransaction();
      await t.begin();

      await usersService.createUser({ firstName: 'first', lastName: 'first' });

      await tm.autoTransaction(async (t2) => {
        await usersBaseService.createUser({ firstName: 'second', lastName: 'second' });
        const [, usersCount] = await usersService.findAndCountUsers();
        await t2.rollback(); // Should have no effect as there is parentTransaction which is only supported here
        expect(usersCount).to.equal(2);
      }, { propagation: 'SUPPORT' });

      await t.rollback();
      const [, usersCountAfterRollback] = await usersBaseService.findAndCountUsers();
      expect(usersCountAfterRollback).to.equal(0);
    });

    it('should create users in same transaction via method w/ Transactional decorator (created by factory)', async () => {
      const t = await tm.transaction();

      await usersService.transactionallyCreateUser({ firstName: 'first', lastName: 'first' });
      await usersService.transactionallyCreateUser({ firstName: 'second', lastName: 'second' });
      const [, usersCount] = await usersBaseService.findAndCountUsers();

      expect(usersCount).to.equal(2);

      await t.rollback();

      const [, usersCountAfterRollback] = await usersBaseService.findAndCountUsers();
      expect(usersCountAfterRollback).to.equal(0);
    });

    it('should create users in separate transactions via method w/ Transactional decorator (basic)', async () => {
      const t = await tm.transaction();

      await usersService.transactionallySeparatelyCreateUser({ firstName: 'first', lastName: 'first' });
      await usersService.transactionallySeparatelyCreateUser({ firstName: 'second', lastName: 'second' });
      const [, usersCount] = await usersBaseService.findAndCountUsers();

      expect(usersCount).to.equal(2);

      await t.rollback(); // Rollback should have no effect as transactionallySeparatelyCreateUser executes in separate transaction.

      const [, usersCountAfterRollback] = await usersBaseService.findAndCountUsers();
      expect(usersCountAfterRollback).to.equal(2);
    });
  });
});
