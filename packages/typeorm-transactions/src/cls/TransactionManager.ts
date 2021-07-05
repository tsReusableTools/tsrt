import { Connection } from 'typeorm';

import { getConnection } from './utils';
import { Transaction, ITransaction, ITransactionOptions, ITransactionOptionsExtended } from './Transaction';

export class TransactionManager implements ITransactionManager {
  private _connection: Connection;

  constructor(protected readonly _options: ITransactionOptionsExtended = { }) { }

  public createTransaction(options?: ITransactionOptions): Transaction {
    return new Transaction(this._getDefaultOptions(options));
  }

  public async transaction(options?: ITransactionOptions): Promise<Transaction>;
  public async transaction<R = unknown>(cb: (transaction: Transaction) => Promise<R>, options?: ITransactionOptions): Promise<R>;
  public async transaction<R = unknown>(
    cbOrOptions?: ITransactionOptions | ((transaction: Transaction) => Promise<R>), options?: ITransactionOptions,
  ): Promise<Transaction | R> {
    const opts = typeof cbOrOptions === 'function' ? options : cbOrOptions;
    const t = this.createTransaction(opts);

    await t.begin();

    return typeof cbOrOptions === 'function'
      ? cbOrOptions(t)
        .then(async (result) => { await t.rollback(); return result; })
        .catch(async (err) => await t.rollback(err) as unknown as R)
      : t as Transaction;
  }

  public async autoTransaction<R = unknown>(cb: (transaction: Transaction) => Promise<R>, options?: ITransactionOptions): Promise<R> {
    const t = this.createTransaction(options);
    await t.begin();
    return cb(t)
      .then(async (result) => { await t.commit(); return result; })
      .catch(async (err) => await t.rollback(err) as unknown as R);
  }

  public get connection(): Connection {
    const { manager, connection, connectionName } = this._options;
    if (!this._connection) this._connection = manager?.connection ?? getConnection(connection, connectionName);
    return this._connection;
  }

  protected _getDefaultOptions<O extends ITransactionOptions>(options?: O): O {
    return {
      ...options,
      connection: this.connection,
      connectionName: this.connection.name,
      isolationLevel: options?.isolationLevel ?? this._options?.isolationLevel,
      propagation: options?.propagation ?? this._options.propagation,
    };
  }
}

export interface ITransactionManager {
  createTransaction(options?: ITransactionOptions): ITransaction;

  transaction(options?: ITransactionOptions): Promise<ITransaction>;
  transaction<R = unknown>(cb: TransactionCallback<R>, options?: ITransactionOptions): Promise<R>;

  autoTransaction<R = unknown>(cb: TransactionCallback<R>, options?: ITransactionOptions): Promise<R>;
}

export type TransactionCallback<R = unknown> = (transaction: ITransaction) => Promise<R>;
