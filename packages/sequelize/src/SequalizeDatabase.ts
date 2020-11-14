import { Sequelize, SequelizeOptions, Model } from 'sequelize-typescript';
import { log } from '@tsrt/logger';

class SequalizeDatabase {
  private _connection: Sequelize;
  private _models: { [x: string]: Model };

  /** Closes current connection */
  public async close(): Promise<void> {
    this.checkDatabaseConnection();
    await this._connection.close();
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
   *  Inits database connection.
   *
   *  @param SequelizeInstance - Sequelize constructor. This one is necessary because for sequelize
   *  to work correctly, Sequelize constructor is needed to be such as that, used for models
   *  definition.
   *  @param [config] - Sequelize connection config.
   *  @param [checkConnection=true] - Whether to check connection after its creation.
   *  @param [shouldSyncAfterConnection] - Whether to sync after connection creation - for DEV mode.
   */
  public async init(
    SequelizeInstance: typeof Sequelize = Sequelize,
    config: SequelizeOptions = { }, checkConnection = true, shouldSyncAfterConnection = false,
  ): Promise<Sequelize> {
    if (this._connection) return;

    if (!config.host || !config.port || !config.database || !config.username || !config.password) {
      throw new Error('Please, provide at least `host`, `port`, `database`, `username` and `password` options');
    }

    this._connection = new SequelizeInstance({ ...config });

    if (checkConnection) {
      this._connection
        .authenticate()
        .then(() => log.info(
          'Database connection established: \n'
          + `host: ${config.host} \n`
          + `port: ${config.port} \n`
          + `database: ${config.database} \n`
          + `username: ${config.username} \n`,
        ))
        .catch((err: Error) => console.error('ERROR connecting to the database: \n', err));
    }

    if (shouldSyncAfterConnection) {
      await this._connection
        .sync()
        .catch((err: Error) => console.error('ERROR syncing w/ database >>> \n', err));
    }

    return this.connection;
  }

  private checkDatabaseConnection(): void {
    if (!this._connection) throw new Error('Please, call `init()` method first');
  }
}

/** Service for managing database connection over app using Sequelize ORM under the hood */
export const Database = new SequalizeDatabase();
