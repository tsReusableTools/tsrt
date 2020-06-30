import { Transaction, TransactionOptions } from 'sequelize';
import { Sequelize, SequelizeOptions, Model } from 'sequelize-typescript';

import { singleton } from '@ts-utils/utils';

class OrmSequelizeSingleton {
  private _connection: Sequelize;
  private _models: { [x: string]: Model };

  /** Closes current connection */
  public async close(): Promise<void> {
    this.checkDatabaseConnection();
    await this._connection.close();
  }

  /**
   *  Syncs models in code w/ database tables.
   *
   *  @param [force=false] - Wheteher fo sync in `force` mode. In `force` mode it will clear all data.
   */
  public async sync(force = false): Promise<void> {
    this.checkDatabaseConnection();
    await this._connection.sync({ force });
  }

  /** Current database connection */
  public get connection(): Sequelize {
    this.checkDatabaseConnection();
    return this._connection;
  }

  /** Models under current database connection */
  public get models(): { [x: string]: Model } {
    this.checkDatabaseConnection();
    return this._models;
  }

  /**
   *  DB connection initializer (to handle unique connection over app)
   *
   *  @param SequelizeInstance - Sequelize constructor. This one is necessary because for sequelize
   *  to work correctly, Sequelize constructor is needed to be such as that, used for models
   *  definition
   *  @param [config] - Sequelize connection config.
   *  @param [checkConnection=true] - Whether to check connection after its creation.
   *  @param [syncAfterConnection] - Whether to sync after connection creation - for DEV mode.
   */
  public async init(
    SequelizeInstance: typeof Sequelize = Sequelize,
    config: SequelizeOptions = { }, checkConnection = true, syncAfterConnection = false,
  ): Promise<void> {
    if (this._connection) return;

    if (!config.host || !config.port || !config.database || !config.username || !config.password) {
      throw new Error('Please, provide at least `host`, `port`, `database`, `username` and `password` options');
    }

    this._connection = new SequelizeInstance({ ...config });

    if (checkConnection) {
      this._connection
        .authenticate()
        .then(() => console.log(
          'Database connection established: \n',
          `host: ${config.host} \n`,
          `port: ${config.port} \n`,
          `database: ${config.database} \n`,
          `username: ${config.username} \n`,
        ))
        .catch((err: Error) => console.error('ERROR connecting to the PostgreSQL: \n', err));
    }

    if (syncAfterConnection) {
      await this._connection
        .sync()
        .catch((err: Error) => console.error('ERROR syncing PostgreSQL >>> \n', err));
    }
  }

  /**
   *  Creates a transaction or executes a transaction callback
   *
   *  @param [options] - Transactions options
   *  @param [cb] - Transaction callback to be executed for managed transactions
   *
   *  @see https://sequelize.org/master/manual/transactions
   */
  public async createTransaction(options?: TransactionOptions): Promise<Transaction>;
  public async createTransaction<T>(options?: TransactionOptions, cb?: (t: Transaction) => PromiseLike<T>): Promise<T>;
  public async createTransaction<T>(
    options?: TransactionOptions, cb?: (t: Transaction) => PromiseLike<T>,
  ): Promise<T | Transaction> {
    if (!cb) return this._connection.transaction(options);

    return this._connection.transaction(options, cb);
  }

  private checkDatabaseConnection(): void {
    if (!this._connection) throw new Error('Please, call `init()` method first');
  }
}

/** Singleton service for managing database connection over app using Sequelize ORM */
export const OrmSequelize = singleton(OrmSequelizeSingleton);
