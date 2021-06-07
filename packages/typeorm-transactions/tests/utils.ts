import { createConnection, Connection } from 'typeorm';
import { resolve } from 'path';

import * as Models from './models';

export class Database {
  private _connection: Connection;

  public get connection(): Connection {
    return this._connection;
  }

  public async createConnection(): Promise<Connection> {
    if (this.connection) return this.connection;

    this._connection = await createConnection({
      type: 'sqlite',
      database: resolve(__dirname, 'db.sql'),
      entities: Object.values(Models),
      name: 'lala',
    });
    return this.connection;
  }

  public async closeConnection(): Promise<void> {
    await this.connection.close();
  }
}
