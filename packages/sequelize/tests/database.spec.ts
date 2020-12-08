import { assert } from 'chai';
import { Sequelize } from 'sequelize-typescript';

import { Database } from '../src';

import { databaseConfig } from './utils';

describe('Testing Database factory', () => {
  let database: Database;

  it('it should create connection', async () => {
    database = await Database.createConnection(Sequelize, databaseConfig, { logConnectionInfo: false });
    assert.instanceOf(database.connection, Sequelize);
  });

  it('it should has connection instance of Sequelize', async () => {
    assert.instanceOf(database.connection, Sequelize);
  });

  it('it should close connection', async () => {
    await Database.closeConnection(database);
  });
});
