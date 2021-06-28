/* eslint-disable import/no-extraneous-dependencies */
import { createConnection, Connection } from 'typeorm';
// import { resolve } from 'path';
import { config } from 'dotenv';

import * as Models from './models';

config();

export class Database {
  private _connection: Connection;

  public get connection(): Connection {
    return this._connection;
  }

  public async createConnection(): Promise<Connection> {
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
      name: 'lala',
    });
    return this.connection;
  }

  public async closeConnection(): Promise<void> {
    await this.connection.close();
  }
}
