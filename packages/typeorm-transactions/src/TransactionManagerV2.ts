/* eslint-disable max-classes-per-file */
import { EntityManager, Connection, QueryRunner, getConnection } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

import { DEFAULT_TRANSACTION_ID, removeTransactionFromNs, getTransactionFromNs, setTransactionIntoNs } from './utils';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type AnyFunction<T = any> = (...args: any) => T;

export type Propagation = 'REQUIRED' | 'SUPPORT' | 'SEPARATE';

export interface ISimpleTransaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(err?: string | Error): Promise<void>;
}

export interface ITransaction extends ISimpleTransaction {
}

export interface ISimpleTransactionOptions {
  propagation?: Propagation;
  isolationLevel?: IsolationLevel;
}

export interface ITransactionOptions extends ISimpleTransactionOptions {
  connection?: Connection | AnyFunction<Connection>;
  connectionName?: string | AnyFunction<string>;
  manager?: EntityManager;
  transaction?: ITransaction;
}

export type TransactionCallback<R = unknown> = (transaction: ITransaction) => Promise<R>;

export interface ITransactionManager {
  transaction(options?: ITransactionOptions): Promise<ITransaction>;
  transaction<R = unknown>(cb: TransactionCallback<R>, options?: ITransactionOptions): Promise<R>;

  createTransaction(options?: ITransactionOptions): ITransaction;
}

export class Transaction implements ITransaction {
  protected _connection: Connection;
  protected readonly _queryRunner: QueryRunner;
  protected readonly _shouldUseNs: boolean;
  protected readonly _hasParentTransaction: boolean;
  protected readonly _transactionId?: string;
  protected readonly _parentTransaction?: ITransaction;

  constructor(protected readonly _options: ITransactionOptions) {
    // this._validateConnectionOptios(_options);

    const { connection, connectionName, manager, transaction } = _options;

    if (transaction) {
      this._connection = transaction.manager.connection;
      this._transactionId = `${this._connection.name}__${DEFAULT_TRANSACTION_ID}`;
      this._parentTransaction = transaction;
      this._hasParentTransaction = true;
      this._shouldUseNs = DEFAULT_TRANSACTION_ID !== false;
      this._queryRunner = transaction.manager.queryRunner;
    } else {
      this._connection = manager?.connection ?? getConnection(connection, connectionName);
      this._transactionId = `${this._connection.name}__${DEFAULT_TRANSACTION_ID}`;
      this._parentTransaction = getTransactionFromNs(this._transactionId);
      this._hasParentTransaction = !!manager?.queryRunner || !!this._parentTransaction;
      this._shouldUseNs = DEFAULT_TRANSACTION_ID !== false;
      this._queryRunner = manager?.queryRunner ?? this._parentTransaction?.manager.queryRunner ?? this._connection.createQueryRunner();
    }

    if (this._shouldUseNs) {
      this._validateNsAvailability();
      setTransactionIntoNs(this._transactionId, this);
    }
  }

  public get repositories(): RepositoriesInstances<T> {
    if (!this._repositories) {
      const { repositories, repositoryConstructorParams } = this._options;
      this._repositories = createRepositories(repositories, this.manager, repositoryConstructorParams);
    }
    return this._repositories;
  }

  public get manager(): EntityManager {
    return this._queryRunner.manager;
  }

  public async begin(): Promise<void> {
    if (this._hasParentTransaction) return;
    if (!this._queryRunner.isTransactionActive) await this._queryRunner.startTransaction(this._options.isolationLevel);
    else throw new Error('Transaction is already started');
  }

  public async commit(): Promise<void> {
    if (this._hasParentTransaction) return;
    if (this._queryRunner.isTransactionActive && !this._options.manager?.queryRunner) await this._queryRunner.commitTransaction();
    if (!this._queryRunner.isReleased && !this._options.manager?.queryRunner) await this._queryRunner.release();
    if (this._shouldUseNs) removeTransactionFromNs(this._transactionId);
  }

  public async rollback(error?: string | Error): Promise<void> {
    if (this._hasParentTransaction) return;
    if (this._queryRunner.isTransactionActive && !this._options.manager?.queryRunner) await this._queryRunner.rollbackTransaction();
    if (!this._queryRunner.isReleased && !this._options.manager?.queryRunner) await this._queryRunner.release();
    if (this._shouldUseNs) removeTransactionFromNs(this._transactionId);
    if (error && typeof error === 'string') throw new Error(error);
    else if (error) throw error;
  }

  protected _validateNsAvailability(): void {
    if (!this._shouldUseNs) return;
    const ns = getTransactionsNamespace();
    if (!ns) throw new Error('Please, create Namespace using `createTransactionsNamespace` method.');
    if (!ns.active) throw new Error('Please, bind Namespace using `bindTransactionsNamespace` or `execInTransactionsNamespace` method.');
  }

  protected _validateConnectionOptios(options: ITransactionOptions<T> = { }): void {
    if (options.transaction && !hasOnlyProperties(options, ['transaction'])) {
      throw new Error('If option `transaction` is provided it is forbidden to provide any other options.');
    }

    if (!hasOnlyOneOfProvidedProperties(options, ['manager', 'connection', 'connectionName'])) return;
    throw new Error('Please, provide only one option of: `manager`, `connection`, `connectionName`.');
  }
}

export class TransactionManager implements ITransactionManager {
  public createTransaction(options?: ITransactionOptions): ITransaction {
    return new Transaction(options);
  }

  public async transaction(options?: ITransactionOptions): Promise<ITransaction>;
  public async transaction<R = unknown>(cb: TransactionCallback<R>, options?: ITransactionOptions): Promise<R>;
  public async transaction<R = unknown>(
    cbOrOptions?: ITransactionOptions | TransactionCallback<R>, options?: ITransactionOptions,
  ): Promise<ITransaction | R> {
    const opts = typeof cbOrOptions === 'function' ? options : cbOrOptions;
    const t = this.createTransaction(opts);

    await t.begin();

    return typeof cbOrOptions === 'function'
      ? cbOrOptions(t)
        .then(async (result) => { await t.rollback(); return result; })
        .catch(async (err) => await t.rollback(err) as unknown as R)
      : t;
  }
}
