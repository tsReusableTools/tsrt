import { Sequelize, SequelizeOptions, ModelCtor } from 'sequelize-typescript';
import { getObjectValuesList } from '@tsrt/utils';

import { IDatabaseConfig } from './interfaces';
import { defaultDatabaseConfig } from './utils';

export class Database {
  protected _connection: Sequelize;

  /**
   *  @param SequelizeInstance - Sequelize constructor. This one is necessary because for sequelize
   *  to work correctly, Sequelize constructor is needed to be such as that, used for models
   *  definition.
   *  @param config - Sequelize connection config.
   *  @param [databaseConfig] - Database optional config.
   */
  protected constructor(
    protected readonly SequelizeInstance: typeof Sequelize,
    protected readonly sequelizeOptions: SequelizeOptions,
    protected readonly databaseConfig: IDatabaseConfig = defaultDatabaseConfig,
  ) { }

  public static async createConnection(
    SequelizeInstance: typeof Sequelize, config: SequelizeOptions, databaseConfig?: IDatabaseConfig,
  ): Promise<Database> {
    const database = new Database(SequelizeInstance, config, databaseConfig);
    await database.connect();
    return database;
  }

  public static async closeConnection(database: Database): Promise<void> {
    await database.disconnect();
  }

  /** Converts object w/ Models to Models list consumable by sequelize-typescript. */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public static getModelsList(models: Record<string, any>): ModelCtor[] {
    return getObjectValuesList(models).filter((item) => typeof item === 'function') as unknown as ModelCtor[];
  }

  /** Current database connection */
  public get connection(): Sequelize {
    this.checkDatabaseConnection();
    return this._connection;
  }

  protected async connect(): Promise<Sequelize> {
    if (this._connection) return;

    const { host, port, database, username, password, dialect } = this.sequelizeOptions;
    const { sync, logConnectionInfo, cbAfterConnected } = this.databaseConfig;

    if (!host || !port || !database || !username || !password || !dialect) {
      throw new Error('Please, provide at least `host`, `port`, `database`, `username`, `password` and `dialect` options');
    }

    try {
      this._connection = new this.SequelizeInstance({ ...this.sequelizeOptions });

      await this._connection.authenticate({ logging: false });
      if (logConnectionInfo) {
        console.log(
          'Database connection established: \n'
          + `host: ${host} \n`
          + `port: ${port} \n`
          + `database: ${database} \n`
          + `username: ${username} \n`,
        );
      }

      if (cbAfterConnected) await cbAfterConnected(this._connection);

      if (sync) await this._connection.sync();

      return this.connection;
    } catch (err) {
      console.error('Error occured while connecting / syncing to the database: \n', err);
    }
  }

  protected async disconnect(): Promise<void> {
    this.checkDatabaseConnection();
    await this._connection.close();
  }

  protected checkDatabaseConnection(): void {
    if (!this._connection) throw new Error('Please, call `createConnection()` first');
  }
}
