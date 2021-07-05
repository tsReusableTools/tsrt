/* eslint-disable max-classes-per-file */
/* eslint-disable import/no-extraneous-dependencies */
import { createConnection, Connection } from 'typeorm';
// import { resolve } from 'path';
import { config } from 'dotenv';

import { createTransactionsNamespace, patchTypeOrmRepository, TransactionManager, createTransactional } from '../src';
import * as Models from './models';

config();
createTransactionsNamespace();
patchTypeOrmRepository();

export const connectionName = 'test_connection_name';

export const tm = new TransactionManager({ connectionName });

export const Transactional = createTransactional({ connectionName });

export class Database {
  private _connection: Connection;

  public get connection(): Connection {
    return this._connection;
  }

  public async connect(): Promise<Connection> {
    if (this.connection) return this.connection;

    this._connection = await createConnection({
      // Sqlite doesn't support multiple transactions.
      // type: 'sqlite',
      // database: resolve(__dirname, 'db.sql'),

      type: 'postgres',
      username: process.env.PGUSER,
      host: process.env.PGHOST,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: +process.env.PGPORT,

      // logging: true,
      entities: Object.values(Models),
      name: connectionName,
    });
    return this.connection;
  }

  public async disconnect(): Promise<void> {
    await this.connection.close();
  }
}

export class DatabaseFactory {
  public static create(): Database {
    return new Database();
  }
}
